module.exports = {
  apps: [{
    name:         'timetable',
    script:       'server.js',
    interpreter:  'node',
    watch:        false,
    autorestart:  true,
    max_restarts: 10,
    env: {
      NODE_ENV: 'production',
      PORT:     '80',
    },
  }],
}
