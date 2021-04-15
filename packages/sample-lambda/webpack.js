const path = require('path');
const webpack = require('webpack');

module.exports = {
  mode: 'production',
  resolve: {
    extensions: ['.js'],
  },
  target: 'node',
  externals: ['left-pad', '@aws-sdk/client-sts', 'datadog-lambda-js'],
  entry: {
    main: path.join(__dirname, 'src/handler.js'),
  },
  plugins: [
    new webpack.BannerPlugin({
      banner: `require('/opt/nodejs/.pnp.cjs').setup();`,
      raw: true,
    })
  ],
  output: {
    libraryTarget: 'commonjs',
    path: path.join(__dirname, 'build'),
    filename: 'handler.js',
  },
};
