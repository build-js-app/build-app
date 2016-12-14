"use strict";

const path = require("path");
const webpack = require('webpack');

let options = {
    minify: true
};

let config = {
    entry: [
        "babel-polyfill",
        "./server/build/src/startServer.js"
    ],
    output: {
        path: "./server/build",
        filename: 'server.js'
    },
    resolve: {
        extensions: ["", ".js"]
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
                loader: "babel-loader"
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