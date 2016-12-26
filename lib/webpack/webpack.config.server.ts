import * as path from 'path';
import * as webpack from 'webpack';

let options = {
    minify: true
};

let config = {
    entry: [
        "babel-polyfill"
    ],
    output: {
        path: "",
        filename: 'server.js'
    },
    resolve: {
        extensions: ["", ".js"]
    },
    resolveLoader: {
        root: ''
    },
    target: 'node',
    node: {
        __filename: false,
        __dirname: false
    },
    plugins: loadPlugins(),
    module: {
        loaders: [
            {
                test: /\.js$/,
                exclude: /node_modules/,
                loader: "babel-loader",
                query: {
                    babelrc: false,
                    presets: [require.resolve('babel-preset-es2015')],
                },
            },
            {
                test: /\.json$/,
                loader: "json-loader"
            }
        ]
    },
    devtool: "source-map"
};

function loadPlugins() {
    let result = [];

    let minifyPlugin = new webpack.optimize.UglifyJsPlugin({
        compress: {
            warnings: false
        }
    });

    if (options.minify) {
        result.push(minifyPlugin);
    }

    return result;
}

module.exports = config;