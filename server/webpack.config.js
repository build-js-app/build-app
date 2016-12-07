"use strict";

const path = require("path");
const webpack = require('webpack');

module.exports = {
    entry: [
        "babel-polyfill",
        "./build/src/startServer.js"
    ],
    output: {
        path: "./build",
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