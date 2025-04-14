module.exports = {
  apps: [
    {
      name: "simple-node-app",
      script: "./app.js",
      instances: 1,
      exec_mode: "fork",
      autorestart: true,
      watch: false
    }
  ]
};
