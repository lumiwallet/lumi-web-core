const path = require('path')
const webpack = require('webpack')

module.exports = {
  entry: {
    main: path.resolve(__dirname, './src/index.js')
  },
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: '[name].bundle.js',
    library: 'lumi',
    libraryTarget: 'umd'
  },
  module: {
    rules: [
      {
        test: /\.(js)$/,
        exclude: /node_modules/,
        use: ['babel-loader']
      },
      {
        test: /\.worker\.js$/,
        use: {
          loader: 'worker-loader',
          options: {
            inline: 'fallback'
          }
        }
      }
    ]
  },
  resolve: {
    extensions: ['.js'],
    alias: {
      '@': path.resolve(__dirname, 'src')
    }
    // symlinks: false
  }
}
