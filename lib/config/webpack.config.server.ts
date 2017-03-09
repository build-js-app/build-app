import * as webpack from 'webpack';
import * as fs from 'fs-extra';
import pathHelper from '../helpers/pathHelper';
import babelPresetLoader from './babelPreset';
import config from './config';

export default {
    load: loadConfig
}

let webpackConfig = {
    entry: [
        pathHelper.serverRelative(config.paths.server.entry)
    ],
    output: {
        path: pathHelper.serverRelative(config.paths.server.build),
        filename: 'server.js',
        libraryTarget: 'commonjs2',
        publicPath: pathHelper.serverRelative('./')
    },
    resolve: {
        extensions: ['.js', '.json'],
        modules: [
            pathHelper.moduleRelative('./node_modules')
        ]
    },
    resolveLoader: {
        modules: [
            pathHelper.moduleRelative('./node_modules')
        ]
    },
    target: 'node',
    node: {
        __filename: false,
        __dirname: false
    },
    devtool: 'source-map',
    plugins: loadPlugins(),
    externals: {},
    module: {
        rules: [
            {
                test: /\.json$/,
                loader: "json-loader"
            }
        ]
    }
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
    webpackConfig.output.path = pathHelper.serverRelative(config.paths.server.build);

    if (isDev) {
        initBabel();
    } else {
        initBabel(config.server.build.nodeVersion)
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

function initBabel(nodeVersion?) {
    let preset = null;

    if (config.server.sourceLang === 'ts') {
        preset = require.resolve('babel-preset-es2015');
    } else {
        preset = babelPresetLoader.loadPreset(nodeVersion);
    }

    let babelLoader = {
        test: /\.js$/,
        exclude: /node_modules/,
        loader: 'babel-loader',
        options: {
            //TODO enable custom, like in backpack
            babelrc: false,
            presets: [preset]
        }
    };

    webpackConfig.module.rules.push(babelLoader);
}

