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
    {
      name:         'timetable-mcp',
      script:       'mcp-server/server.js',
      interpreter:  'node',
      watch:        false,
      autorestart:  true,
      max_restarts: 10,
      env: {
        NODE_ENV:           'production',
        MCP_PORT:           '3002',
        TIMETABLE_API_URL:  'http://localhost',
      },
    },
  ],
}
