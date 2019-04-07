const path = require('path');

module.exports = {
  entry: path.resolve(__dirname, 'lib/index.js'),
  output: {
    path: path.resolve(__dirname, 'lib/es5'),
    filename: 'bundle.js',
    library: 'rpgDiceRoller',
    libraryTarget: 'umd',
    umdNamedDefine: true,
    /**
     * Fix bug in global object definition
     * @link https://stackoverflow.com/questions/49111086/webpack-4-universal-library-target
     */
    globalObject: '(typeof self !== "undefined" ? self : this)',
  },
  module: {
    rules: [
      {
        test: /lib\/.+\.js$/,
        exclude: /node_modules/,
        use: [
          /**
           * lint the JS
           */
          {
            loader: 'jshint-loader',
          },
          /**
           * Compile the JS
           */
          {
            loader: 'babel-loader',
            options: {
              babelrc: true,
            },
          },
        ],
      },
    ],
  },
  /**
   * Setting for dev testing server
   * @link https://webpack.js.org/guides/development/
   */
  devServer: {
    compress: true,
    index: 'demo/index.es5.html',
    open: true,
    openPage: '/demo/index.es5.html',
    overlay: {
      warnings: true,
      errors: true,
    },
    publicPath: '/lib/es5/',
  },
};
