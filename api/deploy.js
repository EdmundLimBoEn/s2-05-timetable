import { exec } from 'node:child_process'
import { fileURLToPath } from 'node:url'
import path from 'node:path'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.resolve(__dirname, '..')

export default function deployHandler(req, res) {
  const secret = process.env.DEPLOY_SECRET
  if (!secret || req.headers.authorization !== `Bearer ${secret}`) {
    return res.status(401).json({ error: 'unauthorized' })
  }

  const branch = process.env.DEPLOY_BRANCH || 'main'
  const pm2Name = process.env.PM2_NAME || 'timetable'
  const repo = 'EdmundLimBoEn/s2-05-timetable'

  res.json({ ok: true, branch, pm2: pm2Name })

  const script = `
    set -e
    TMP=$(mktemp -d)
    curl -sL "https://api.github.com/repos/${repo}/tarball/${branch}" -o "$TMP/source.tar.gz"
    tar -xzf "$TMP/source.tar.gz" -C "$TMP"
    EXTRACTED=$(ls "$TMP" | grep -v source.tar.gz | head -1)
    rsync -a --delete \\
      --exclude='.git' \\
      --exclude='node_modules' \\
      --exclude='data' \\
      --exclude='.env' \\
      "$TMP/$EXTRACTED/" "${ROOT}/"
    cd "${ROOT}"
    npm install --omit=dev
    rm -rf "$TMP"
    pm2 restart ${pm2Name}
  `

  exec(script, { shell: '/bin/bash' }, (err, stdout, stderr) => {
    if (err) console.error('[deploy] error:', stderr.trim())
    else console.log('[deploy] ok:', stdout.trim())
  })
}
