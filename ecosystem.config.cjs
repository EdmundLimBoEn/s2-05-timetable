module.exports = {
  apps: [
    {
      name:         'timetable',
      script:       'server.js',
      interpreter:  'node',
      watch:        false,
      autorestart:  true,
      max_restarts: 10,
      env: {
        NODE_ENV:      'production',
        PORT:          '80',
        DEPLOY_BRANCH: 'main',
        PM2_NAME:      'timetable',
      },
    },
    {
      name:         'timetable-dev',
      script:       'server.js',
      interpreter:  'node',
      watch:        false,
      autorestart:  true,
      max_restarts: 10,
      env: {
        NODE_ENV:      'development',
        PORT:          '3001',
        DEPLOY_BRANCH: 'dev',
        PM2_NAME:      'timetable-dev',
      },
    },
  ],
}
