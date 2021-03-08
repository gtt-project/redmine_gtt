/**
 * Webpack production build
 */
module.exports = {
  mode: "production",
  entry: __dirname + "/src/app/index.js",
  devtool: "source-map",
  output: {
    path: __dirname + "/assets/javascripts",
    filename: "app.bundle.js",
    publicPath: "/",
  },
  module: {
    rules: [{
      test: /\.(css)$/,
      use: ["style-loader", "css-loader"],
    }],
  },
};
