import { exec } from 'node:child_process'
import path from 'node:path'

const KNOWN_TARGETS = {
  'timetable':     'timetable',
  'timetable-dev': 'timetable-dev',
}

const ALLOWED_BRANCHES = new Set(['main', 'dev'])

export default function deployHandler(req, res) {
  const secret = process.env.DEPLOY_SECRET
  if (!secret || req.headers.authorization !== `Bearer ${secret}`) {
    return res.status(401).json({ error: 'unauthorized' })
  }

  // Body overrides env so that the production endpoint can also deploy dev
  const branch  = req.body?.branch  || process.env.DEPLOY_BRANCH || 'main'
  const pm2Name = req.body?.pm2     || process.env.PM2_NAME      || 'timetable'

  if (!ALLOWED_BRANCHES.has(branch)) {
    return res.status(400).json({ error: 'unknown branch' })
  }

  if (!KNOWN_TARGETS[pm2Name]) {
    return res.status(400).json({ error: 'unknown pm2 target' })
  }

  const targetDir = path.join(process.env.HOME || '/root', KNOWN_TARGETS[pm2Name])
  const repo = 'EdmundLimBoEn/s2-05-timetable'

  res.json({ ok: true, branch, pm2: pm2Name, dir: targetDir })

  // Branch and pm2Name are passed as env vars to avoid any shell interpolation risk.
  const script = `
    set -e
    TMP=$(mktemp -d)
    curl -sL "https://api.github.com/repos/${repo}/tarball/$DEPLOY_BRANCH" -o "$TMP/source.tar.gz"
    tar -xzf "$TMP/source.tar.gz" -C "$TMP"
    EXTRACTED=$(ls "$TMP" | grep -v source.tar.gz | head -1)
    rsync -a --delete \\
      --exclude='.git' \\
      --exclude='node_modules' \\
      --exclude='data' \\
      --exclude='.env' \\
      "$TMP/$EXTRACTED/" "${targetDir}/"
    cd "${targetDir}"
    npm install --omit=dev
    rm -rf "$TMP"
    pm2 restart "$DEPLOY_PM2"
  `

  exec(script, { shell: '/bin/bash', env: { ...process.env, DEPLOY_BRANCH: branch, DEPLOY_PM2: pm2Name } }, (err, stdout, stderr) => {
    if (err) console.error('[deploy] error:', stderr.trim())
    else console.log('[deploy] ok:', stdout.trim())
  })
}
