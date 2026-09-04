// PM2 process definition for the API. Start with:
//   pm2 start deploy/ecosystem.config.cjs --env production
// Then persist across reboots: pm2 save && pm2 startup
module.exports = {
  apps: [
    {
      name: 'hcc-api',
      cwd: '/var/www/high-court-clerk-cpt',
      script: 'server/index.js',
      // Load the untracked .env at the repo root (cwd) natively — the server
      // reads process.env, so real secrets must be injected here.
      node_args: '--env-file-if-exists=.env',
      instances: 1,
      exec_mode: 'fork',
      max_memory_restart: '300M',
      env: {
        NODE_ENV: 'production',
        PORT: '4000',
        // Real secrets come from the machine environment / an untracked .env,
        // never from this file. RUN_MIGRATIONS=true on first boot only.
      },
      out_file: '/var/log/hcc/api.out.log',
      error_file: '/var/log/hcc/api.err.log',
      time: true,
    },
  ],
};
