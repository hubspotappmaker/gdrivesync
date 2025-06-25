console.log("✅ Đã load next.config.js");

const path = require('path');

module.exports = {
  basePath: '/fe',
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
  webpack: (config, { isServer }) => {
    // ⚠️ Thêm alias để "fake" module bị lỗi
    config.resolve.alias['rc-notification/es/Notice'] = path.resolve(__dirname, 'empty.js');
    return config;
  },
  async rewrites() {
    return [
      {
        source: '/fe/connect-platform-app/application/connect-hubspot',
        destination: '/connect-platform-app/application/connect-hubspot',
      },
      {
        source: '/fe/home',
        destination: '/home',
      },
    ];
  },
};
