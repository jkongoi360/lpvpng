module.exports = {
  apps: [{
    name: 'lpvpng',
    cwd: '/var/www/lpvpng',
    script: 'node_modules/next/dist/bin/next',
    args: 'start -p 3030',
    env: { NODE_ENV: 'production', PORT: '3030' },
    autorestart: true,
    max_restarts: 50,
    kill_timeout: 30000,
    restart_delay: 3000
  }]
}
