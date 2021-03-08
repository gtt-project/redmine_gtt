/**
 * Webpack development server
 */
 const HtmlWebpackPlugin = require("html-webpack-plugin");

module.exports = {
  mode: "development",
  entry: __dirname + "/src/app/index.js",
  devtool: "inline-source-map",
  devServer: {
    contentBase: "./src/public",
    port: 7700,
  },
  output: {
    path: __dirname + "/dist",
    filename: "app.bundle.js",
    publicPath: "/",
    clean: true,
  },
  module: {
    rules: [{
      test: /\.(css)$/,
      use: ["style-loader", "css-loader"],
    }],
  },
  plugins: [
    new HtmlWebpackPlugin({
      template: __dirname + "/src/public/index.html",
      inject: "body"
    }),
  ],
};
