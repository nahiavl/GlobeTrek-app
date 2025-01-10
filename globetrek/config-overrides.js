const webpack = require('webpack');

module.exports = function override(config, env) {
  config.resolve.fallback = {
    ...config.resolve.fallback,
    buffer: require.resolve('buffer/'),
    stream: require.resolve('stream-browserify'),
    crypto: require.resolve('crypto-browserify'),
    path: require.resolve('path-browserify'),
    fs: false, // Disable fs (not available in browsers)
  };

  config.plugins = [
    ...(config.plugins || []),
    new webpack.ProvidePlugin({
      Buffer: ['buffer', 'Buffer'], // Add global Buffer support
      process: 'process/browser',  // Add global process support
    }),
  ];

  return config;
};