module.exports = {
  apps: [
    {
      name: "whatsapp-web-api",
      script: "./src/api.js",
      watch: ["./src"],
      ignore_watch: ["*/**/last.qr"],
    },
  ],
};
