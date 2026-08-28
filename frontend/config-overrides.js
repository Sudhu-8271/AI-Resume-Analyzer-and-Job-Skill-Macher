module.exports = function override(config) {

  config.resolve.fallback = {
    fs: false,
    path: false,
    os: false
  };

  return config;
};