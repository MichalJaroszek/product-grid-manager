const webpack = require('webpack');

module.exports = {
  webpack: {
    configure: {
      resolve: {
        fallback: {
          "buffer": false,
          "timers": false,
          "stream": false,
          "util": false,
          "string_decoder": false
        }
      }
    }
  }
};