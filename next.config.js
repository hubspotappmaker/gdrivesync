console.log("✅ Đã load next.config.js");

module.exports = {
  basePath: '/fe',  // Giữ basePath là '/fe'

  async rewrites() {
    return [
      {
        source: '/fe/connect-platform-app/application/connect-hubspot',
        destination: '/connect-platform-app/application/connect-hubspot', // Xử lý URL "/fe" để chuyển sang đường dẫn không có "/fe"
      },
      {
        source: '/fe/home',
        destination: '/home', // Xử lý "/fe/home" để chuyển về "/home"
      },
    ];
  },
};
