import * as webpack from 'webpack';
import * as fs from 'fs-extra';

import pathHelper from '../helpers/pathHelper';
import config from './config';
import envHelper from '../helpers/envHelper';

export default {
    loadWebpackConfig
}

type Webpack_Profile = 'js_prod' | 'ts_prod' | 'js_dev'; //js_dev not supported yet

function loadWebpackConfig(profile: Webpack_Profile) {
    let webpackConfig = getDefaultConfig();

    if (profile === 'ts_prod') {
        let tsEntry = envHelper.getTsBuildEntry();

        webpackConfig.entry = ['babel-polyfill', tsEntry];
    } else {
        let jsEntry = envHelper.getServerEntry();
        webpackConfig.entry = [jsEntry];
    }

    loadPlugins(webpackConfig);

    let presetName = profile === 'ts_prod' ? 'babel-preset-es2015' : 'babel-preset-backpack';

    initBabel(webpackConfig, presetName);

    loadExternals(webpackConfig, ['regenerator-runtime']);

    return webpackConfig;
}

function getDefaultConfig() {
//missing: entry, externals
    return {
        target: 'node',
        devtool: 'source-map',
        performance: {
            hints: false
        },
        entry: [], //defined later
        externals: {}, //loaded later
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
        node: {
            __filename: false,
            __dirname: false
        },
        plugins: [
            new webpack.NoErrorsPlugin()
        ],
        module: {
            rules: [
                {
                    test: /\.json$/,
                    loader: "json-loader"
                }
            ]
        }
    };
}

function loadPlugins(webpackConfig) {
    if (config.server.build.minify) {
        let minifyPlugin = new webpack.optimize.UglifyJsPlugin({
            compress: {
                warnings: false
            }
        });

        webpackConfig.plugins.push(minifyPlugin);
    }
}

function initBabel(webpackConfig, presetName) {
    let preset = require.resolve(presetName);

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

function loadExternals(webpackConfig, whitelist) {
    let nodeModules = {};
    let nodeModulesPath = pathHelper.serverRelative('./node_modules');
    fs.readdirSync(nodeModulesPath)
        .filter(function (x) {
            if (['.bin'].indexOf(x) !== -1) return false;
            if (whitelist.indexOf(x) !== -1) return false;

            return true;
        })
        .forEach(function (mod) {
            nodeModules[mod] = 'commonjs ' + mod;
        });

    webpackConfig.externals = nodeModules;
}