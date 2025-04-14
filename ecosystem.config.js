module.exports = {
    apps: [
      {
        name: "simple-node-app",
        script: "./app.js",
        instances: 1,
        autorestart: true,
        watch: false
      }
    ]
  };
  