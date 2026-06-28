module.exports = {
  apps: [
    {
      name: "keep-alive",
      script: "scripts/keep-alive.mjs",
      autorestart: true,
      restart_delay: 5000,
      log_date_format: "YYYY-MM-DD HH:mm:ss",
    },
  ],
}
