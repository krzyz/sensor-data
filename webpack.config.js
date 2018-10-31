const path = require('path'); 

/*
const HtmlWebpackPlugin = require('html-webpack-plugin');
const HtmlWebpackPluginConfig = new HtmlWebpackPlugin({
  template: './src/index.html',
  filename: 'templates/index.html',
  inject: 'body'
})
*/

module.exports = { 
  entry: './src/index.js', 
  output: {
    path: path.resolve('dist'), 
    filename: 'static/index_bundle.js', 
    libraryTarget: 'var',
    library: 'mylibrary'
  }, 
  module: {
    rules: [
      { test: /\.js$/, loader: 'babel-loader', exclude: /node_modules/ }
     ]
  },
  //plugins: [HtmlWebpackPluginConfig]
} 