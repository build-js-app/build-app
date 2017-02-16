import * as webpack from 'webpack';
import * as fs from 'fs-extra';
import pathHelper from '../helpers/pathHelper';
import config from './config';

export default {
    load: loadConfig
}

let preset = 'babel-preset-es2015';

let webpackConfig = {
    entry: [
        'babel-polyfill',
        pathHelper.serverRelative(config.paths.server.entry)
    ],
    output: {
        path: '',
        filename: 'server.js',
        libraryTarget: 'commonjs2'
    },
    resolve: {
        extensions: ['.js', '.json'],
        modules: [
            'node_modules',
            pathHelper.moduleRelative('node_modules')
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

    if (config.server.build.transpileJs) {
        let babelLoader = {
            test: /\.js$/,
            exclude: /node_modules/,
            loader: 'babel-loader',
            options: {
                //TODO enable custom, like in backpack
                babelrc: false,
                presets: [require.resolve(preset)]
            }
        };

        webpackConfig.module.rules.push(babelLoader);
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