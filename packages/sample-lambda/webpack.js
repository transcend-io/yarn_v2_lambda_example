const path = require('path');
const nodeExternals = require('webpack-node-externals');

module.exports = {
  mode: 'production',
  resolve: {
    extensions: ['.js'],
  },
  target: 'node',
  // externals: [nodeExternals()],
  externals: ['left-pad'],
  entry: {
    main: path.join(__dirname, 'src/handler.js'),
  },
  output: {
    libraryTarget: 'commonjs',
    path: path.join(__dirname, 'build'),
    filename: 'handler.js',
  },
};
