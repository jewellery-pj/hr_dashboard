module.exports = {
  apps: [{
    name: 'hr-dashboard',
    script: 'server.ts',
    interpreter: './node_modules/.bin/tsx',
    cwd: '/var/www/hr_dashboard',
    instances: 1,
    exec_mode: 'fork',
    autorestart: true,
    watch: false,
    max_memory_restart: '1G',
    env: {
      NODE_ENV: 'production',
      PORT: 8000
    },
    error_file: '/var/www/hr_dashboard/logs/error.log',
    out_file: '/var/www/hr_dashboard/logs/out.log',
    log_file: '/var/www/hr_dashboard/logs/combined.log',
    time: true
  }]
};
