const path = require('path');

module.exports = {
  mode: 'production',
  resolve: {
    extensions: ['.js'],
  },
  target: 'node',
  entry: {
    main: path.join(__dirname, 'src/handler.js'),
  },
  output: {
    libraryTarget: 'commonjs',
    path: path.join(__dirname, 'build'),
    filename: 'handler.js',
  },
};
