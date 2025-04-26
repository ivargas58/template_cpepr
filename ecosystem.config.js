module.exports = {
  apps: [
    {
      name: "template_cpepr",
      script: "./app.js",
      instances: 1,
      exec_mode: "fork",
      autorestart: true,
      watch: false
    }
  ]
};
//
