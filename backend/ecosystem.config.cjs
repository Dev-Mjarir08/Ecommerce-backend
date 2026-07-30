module.exports = {
  apps: [
    {
      name: 'croma-ecommerce-backend',
      script: 'src/server.js',
      instances: 'max', // Scale across all CPU cores automatically
      exec_mode: 'cluster',
      autorestart: true,
      watch: false,
      max_memory_restart: '500M',
      env_production: {
        NODE_ENV: 'production',
        PORT: 8081,
      },
      // Graceful shutdown & reload config
      kill_timeout: 5000,
      listen_timeout: 8000,
    },
  ],
};
