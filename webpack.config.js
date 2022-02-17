const path = require('path')
const webpack = require('webpack')
const CopyWebpackPlugin = require('copy-webpack-plugin')
const { CleanWebpackPlugin } = require('clean-webpack-plugin')

module.exports = {
  mode: 'production',
  entry: {
    main: path.resolve(__dirname, './src/index.js')
  },
  output: {
    webassemblyModuleFilename: "[hash].wasm",
    path: path.resolve(__dirname, 'dist'),
    filename: '[name].bundle.js',
    library: 'lumi',
    libraryTarget: 'umd',
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
      },
      {
        test: /\.wasm$/,
        type: 'webassembly/async',
      },
    ]
  },
  resolve: {
    modules: ['node_modules'],
    extensions: ['.js'],
    alias: {
      '@': path.resolve(__dirname, 'src')
    },
    fallback: {
      "buffer": require.resolve("buffer"),
      "stream": require.resolve("stream-browserify"),
      "crypto": require.resolve("crypto-browserify"),
      "assert": require.resolve("assert"),
      "url": require.resolve("url"),
      "process": require.resolve("process"),
    }
  },
  experiments: {
    asyncWebAssembly: true,
    syncWebAssembly: true,
    topLevelAwait: true,
  },
  plugins: [
    new CleanWebpackPlugin(),
    // Work around for Buffer is undefined:
    // https://github.com/webpack/changelog-v5/issues/10
    new webpack.ProvidePlugin({
      Buffer: ['buffer', 'Buffer'],
    }),
    new webpack.ProvidePlugin({
      process: 'process/browser',
    }),
    new webpack.ContextReplacementPlugin(/@emurgo\/cardano-serialization-lib-browser/),
    new webpack.optimize.LimitChunkCountPlugin({
      maxChunks: 1,
    }),
    new webpack.SourceMapDevToolPlugin({
      filename: '[file].map',
    }),
    // new CopyWebpackPlugin({
    //   patterns: [
    //     {from: './node_modules/@emurgo/cardano-serialization-lib-browser/cardano_serialization_lib_bg.wasm' },
    //   ]
    // })
  ],
  optimization: {
    chunkIds: "deterministic",
    minimize: false,
  },
}
