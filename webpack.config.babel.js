var path = require('path');
var webpack = require('webpack');
module.exports = {
  entry: './src/stream-quality-mos.js',
  output: {
    filename: 'stream-quality-mos.bundle.js'
  },
  module: {
    rules: [
      {
        test: /\.js$/,
        loader: 'babel-loader',
        query: {
          presets: ['@babel/preset-env']
        }
      }
    ]
  },
  stats: {
    colors: true
  }
};
