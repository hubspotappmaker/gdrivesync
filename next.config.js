console.log("✅ Đã load next.config.js");

module.exports = {
  basePath: '/fe',  // Giữ basePath là '/fe'
  experimental: {
    esmExternals: false,
  },
  transpilePackages: [
    '@babel/runtime',
    '@ant-design/icons',
    '@ant-design/icons-svg',
    'rc-util',
    'rc-pagination',
    'rc-select',
    'rc-trigger',
    'rc-tooltip',
    'rc-field-form',
    'rc-table',
    'rc-tabs',
    'rc-resize-observer',
    'rc-picker',
    'rc-input',
    'rc-collapse',
    'rc-dialog',
    'rc-dropdown',
    'rc-virtual-list',
    'rc-tree',
    '@rc-component/util'
  ],
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
