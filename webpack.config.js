const path = require('path');

// Define loaders
// Loaders for processing Sass files
const sassLoaders = [
  'style-loader',
  {
    loader: 'css-loader',
    options: {
      url: false, // Prevent css-loader from interpreting URLs
    },
  },
  'sass-loader',
];

// Loaders for processing CSS files
const cssLoaders = ['style-loader', 'css-loader'];

// Loaders for processing image files
const imageLoaders = {
  test: /\.(png|svg|jpg|jpeg|gif)$/i,
  type: 'asset/resource',
  generator: {
    filename: '../images/[name][ext]', // Keep the original file name and extension
  },
};

// Loaders for processing font files
const fontLoaders = {
  test: /\.(woff|woff2|eot|ttf|otf)$/i,
  type: 'asset/resource',
  generator: {
    filename: '../fonts/[name][ext]', // Keep the original file name and extension
  },
};

// Loaders for processing TypeScript files
const tsLoaders = {
  test: /\.ts$/i,
  use: 'ts-loader',
};

module.exports = {
  mode: 'production', // Set build mode to production
  entry: path.join(__dirname, 'src', 'index.ts'), // Specify entry point
  module: {
    rules: [
      // Apply loaders
      { test: /\.s[ac]ss$/i, use: sassLoaders },
      { test: /\.css$/i, use: cssLoaders },
      imageLoaders,
      fontLoaders,
      tsLoaders,
    ],
  },
  devtool: false, // Disable source maps
  // devtool: 'source-map', // Generate source maps for easier debugging
  resolve: {
    extensions: ['.ts', '.js'], // Specify file extensions to resolve
  },
  output: {
    filename: 'main.js',
    path: path.resolve(__dirname, 'assets/javascripts'),
    assetModuleFilename: '[name].[ext]',
  },
};
