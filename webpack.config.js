const path = require('path');
const TerserPlugin = require('terser-webpack-plugin');

module.exports = {
    mode: 'production',
    entry: {
        portal_manager: "./src/PortalManager.ts",
    },
    module: {
        rules: [
            {
                test: /\.tsx?$/,
                use: 'ts-loader',
                exclude: /node_modules/,
            }
        ],
    },
    resolve: {
        extensions: ['.tsx', '.ts', '.js'],
    },
    optimization: {
        minimize: false,
        minimizer: [
            new TerserPlugin({
                terserOptions: {
                    // https://github.com/webpack-contrib/terser-webpack-plugin#terseroptions
                    compress: {
                        passes: 10,
                    },
                    mangle: false,
                },
            }),
        ],
    },
    output: {
        library: '[name]',
        filename: '[name].js',
        path: path.resolve(__dirname, 'dist'),
    },
};
