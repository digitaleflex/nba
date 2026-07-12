module.exports = {
  apps: [
    {
      name: "keep-alive",
      script: "scripts/keep-alive.mjs",
      autorestart: true,
      restart_delay: 5000,
      log_date_format: "YYYY-MM-DD HH:mm:ss",
    },
    {
      name: "websocket",
      script: "workers/websocket.ts",
      interpreter: "npx",
      interpreter_args: "tsx",
      autorestart: true,
      restart_delay: 3000,
      max_restarts: 20,
      log_date_format: "YYYY-MM-DD HH:mm:ss",
      env: {
        WS_PORT: 3001,
      },
    },
  ],
}
