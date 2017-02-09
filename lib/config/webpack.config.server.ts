import * as webpack from 'webpack';
import * as fs from 'fs-extra';
import pathHelper from '../helpers/pathHelper';
import config from './config';

export default {
    load: loadConfig
}

let preset = 'babel-preset-stage-2'; //'babel-preset-es2015'
let transpileJs = true;

let webpackConfig = {
    entry: [
        "babel-polyfill"
    ],
    output: {
        path: "",
        filename: 'server.js'
    },
    resolve: {
        extensions: ["", ".js"],
        fallback: pathHelper.moduleRelative('node_modules')
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
    externals: {},
    module: {
        loaders: [
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

    if (config.server.build.minify) {
        let minifyPlugin = new webpack.optimize.UglifyJsPlugin({
            compress: {
                warnings: false
            }
        });

        result.push(minifyPlugin);
    }

    return result;
}

function loadConfig(isDev = false) {
    webpackConfig.entry.push(pathHelper.serverRelative(config.paths.server.entry));

    webpackConfig.output.path = pathHelper.serverRelative(config.paths.server.build);

    webpackConfig.resolveLoader.root = pathHelper.moduleRelative('node_modules');
    webpackConfig.resolve.fallback = pathHelper.moduleRelative('node_modules');

    if (transpileJs) {
        let babelLoader = {
            test: /\.js$/,
            exclude: /node_modules/,
            loader: "babel-loader",
            query: {
                babelrc: false,
                presets: [require.resolve(preset)],
                plugins: [require.resolve('babel-plugin-transform-es2015-modules-commonjs')]
            }
        };

        webpackConfig.module.loaders.push(babelLoader);
    }

    //TODO consider using 'webpack-node-externals' plugin
    if (isDev || !config.server.build.bundleNodeModules) {
        let nodeModules = {};
        let nodeModulesPath = pathHelper.serverRelative('./node_modules');
        fs.readdirSync(nodeModulesPath)
            .filter(function (x) {
                return ['.bin'].indexOf(x) === -1;
            })
            .forEach(function (mod) {
                nodeModules[mod] = 'commonjs ' + mod;
            });

        webpackConfig.externals = nodeModules;
    }

    return webpackConfig;
}