// @ts-check
const path = require('node:path')
const HtmlWebpackPlugin = require('html-webpack-plugin')
const MiniCssExtractPlugin = require('mini-css-extract-plugin')

/**
 * Builds a static, self-contained `dist/` folder that can be opened directly from disk
 * (file://) — no dev server required. See docs/adr/0003 and docs/adr/0004.
 *
 * @param {unknown} _env
 * @param {{ mode?: 'production' | 'development' | 'none' }} argv
 * @returns {import('webpack').Configuration}
 */
module.exports = (_env, argv) => {
  const isProduction = argv.mode === 'production'

  return {
    mode: isProduction ? 'production' : 'development',
    entry: './src/index.ts',
    output: {
      path: path.resolve(__dirname, 'dist'),
      filename: isProduction ? 'bundle.[contenthash:8].js' : 'bundle.js',
      // Relative public path so assets resolve when opened via file://
      publicPath: '',
      clean: true,
    },
    resolve: {
      extensions: ['.ts', '.js'],
    },
    // External source maps (not eval) so dist/ works without a server and debugs nicely
    devtool: 'source-map',
    module: {
      rules: [
        {
          test: /\.ts$/,
          use: 'ts-loader',
          exclude: /node_modules/,
        },
        {
          test: /\.css$/,
          use: [MiniCssExtractPlugin.loader, 'css-loader'],
        },
      ],
    },
    plugins: [
      new HtmlWebpackPlugin({
        template: './src/index.html',
        // Classic deferred script (not type="module"): ES modules are blocked on file://
        scriptLoading: 'defer',
      }),
      new MiniCssExtractPlugin({
        filename: isProduction ? 'styles.[contenthash:8].css' : 'styles.css',
      }),
    ],
    watchOptions: {
      ignored: /node_modules/,
    },
    performance: {
      hints: false,
    },
  }
}
