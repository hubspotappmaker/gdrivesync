console.log("✅ Đã load next.config.js");

module.exports = {
  async rewrites() {
    console.log("🔁 Rewrite API proxy đang được cấu hình");
    return [
      {
        source: '/api/connect-gg-driver',
        destination: 'http://165.227.75.90:8080/application/connect-gg-driver',
      },
    ];
  },
};
