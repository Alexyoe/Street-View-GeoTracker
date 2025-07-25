const path = require("path");
const { CleanWebpackPlugin } = require("clean-webpack-plugin");
const CopyPlugin = require("copy-webpack-plugin");
const HtmlPlugin = require("html-webpack-plugin");

module.exports = {
  mode: "production",
  entry: {
    // background: './src/background.js',
    content: "./src/content.js",
    popup: "./src/popup.js",
  },
  output: {
    path: path.resolve(__dirname, "dist"),
    filename: "[name].js", // background.js, content.js, popup.js
  },
  plugins: [
    new CleanWebpackPlugin(),
    // copy manifest + any icons
    new CopyPlugin({
      patterns: [
        { from: "manifest.json", to: "." },
        // { from: 'icons', to: 'icons' }  // if you have icons
      ],
    }),
    // generate popup.html and auto‑inject popup.js
    new HtmlPlugin({
      filename: "popup.html",
      template: "./src/popup.html",
      chunks: ["popup"],
    }),
  ],
  module: {
    rules: [
      // e.g. if you want to transpile with Babel:
      // {
      //   test: /\.js$/,
      //   exclude: /node_modules/,
      //   use: { loader: 'babel-loader', options: {/*…*/} }
      // }
    ],
  },
  // this prevents webpack from bundling chrome.* APIs
  externals: {
    chrome: "chrome",
  },
};
