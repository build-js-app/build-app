"use strict";

const path = require("path");
const webpack = require('webpack');

module.exports = {
    entry: {
        app: "./build/src/app.js"
    },
    output: {
        path: "./build",
        filename: 'app.js'
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
            // {
            //     test: /\.js$/,
            //     exclude: /node_modules/,
            //     loader: "babel-loader",
            //     query: {
            //         // plugins: [
            //         //     'transform-async-to-generator',
            //         //     'transform-es2015-modules-commonjs'
            //         // ]
            //     }
            // }
            {
                test: /\.json$/,
                loader: "json-loader"
            }
        ]
    },
    //externals: [nodeExternals()],
    devtool: "source-map"
};