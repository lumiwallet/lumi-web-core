const path = require('path')
const webpack = require('webpack')
const {CleanWebpackPlugin} = require('clean-webpack-plugin')

module.exports = {
  mode: 'production',
  entry: {
    main: path.resolve(__dirname, './src/index.js')
  },
  output: {
    globalObject: "this",
    webassemblyModuleFilename: '[hash].wasm',
    path: path.resolve(__dirname, 'dist'),
    filename: 'core.bundle.js',
    library: 'lumi',
    libraryTarget: 'umd'
  },
  resolve: {
    modules: ['node_modules'],
    extensions: ['.js', '.jsx'],
    alias: {
      '@': path.resolve(__dirname, 'src')
    },
    fallback: {
      'buffer': require.resolve('buffer'),
      'stream': require.resolve('stream-browserify'),
      'crypto': require.resolve('crypto-browserify'),
      'assert': require.resolve('assert'),
      'url': require.resolve('url'),
      'process': require.resolve('process'),
      'https': require.resolve('https-browserify'),
      "http": require.resolve("stream-http"),
      "os": require.resolve("os-browserify/browser")
    }
  },
  devtool: 'source-map',
  module: {
    rules: [
      {
        test: /\.js$/,
        exclude: /node_modules/,
        use: ['babel-loader']
      }
      // {
      //   test: /\.worker\.js$/,
      //   use: {
      //     loader: 'worker-loader',
      //     options: {
      //       inline: 'fallback'
      //     }
      //   }
      // }
    ]
  },
  plugins: [
    new CleanWebpackPlugin(),
    // Work around for Buffer is undefined:
    // https://github.com/webpack/changelog-v5/issues/10
    new webpack.ProvidePlugin({
      Buffer: ['buffer', 'Buffer']
    }),
    new webpack.ProvidePlugin({
      process: 'process/browser'
    }),
    new webpack.optimize.LimitChunkCountPlugin({
      maxChunks: 1
    }),
    new webpack.SourceMapDevToolPlugin({
      filename: '[file].map'
    })
  ],
  optimization: {
    chunkIds: 'deterministic',
    minimize: false
  },
  experiments: {
    asyncWebAssembly: true,
    syncWebAssembly: true,
    topLevelAwait: true
  }
}
