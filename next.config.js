// next.config.js
module.exports = {
  async headers() {
    return [
      {
        source: "/contact-card",
        headers: [
          {
            key: "X-Frame-Options",
            value: "ALLOWALL"
          }
        ]
      }
    ];
  }
};
