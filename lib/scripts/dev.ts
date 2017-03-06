import helper from './_scriptsHelper';
helper.initEnvVars();

import * as fs from 'fs-extra';
import * as webpack from 'webpack';
import * as _ from 'lodash';
import * as chokidar from 'chokidar';
import webpackConfigLoader from '../config/webpack.config.server';
import webpackHelper from '../helpers/webpackHelper';
import pathHelper from './../helpers/pathHelper';
import utils from './../helpers/utils';
import config from '../config/config';
import * as FriendlyErrorsWebpackPlugin from 'friendly-errors-webpack-plugin';
const nodemon = require('nodemon');

function initEnvVars() {
    if (!process.env.APP_DIR) {
        process.env.APP_DIR = fs.realpathSync(process.cwd());
    }
    process.env.NODE_ENV = 'development';
}

function dev() {
    let watchPath = pathHelper.appRelative(config.paths.serverSrc);
    let watcher = chokidar.watch([watchPath]);

    let webpackConfig = webpackConfigLoader.load(true);

    webpackConfig.plugins.push[new FriendlyErrorsWebpackPlugin()];
    webpackConfig.entry[1] = pathHelper.appRelative('./server/src/index.js');
    webpackConfig.devtool = 'cheap-module-source-map';

    let compiler = webpack(webpackConfig);

    let compile = (cb) => {
        let start = new Date();
        compiler.run((err, stats) => {
            webpackHelper.handleErrors(err, stats, false);

            let end = new Date();
            let timeStr = utils.getFormattedTimeInterval(start, end);

            utils.clearConsole();
            utils.log(`Compiled: ${timeStr}`, 'green');

            if (cb) cb()
        })
    };

    let nodemonInstance = null;

    compile(() => {
        let entry = pathHelper.appRelative(config.paths.serverBundle);
        nodemonInstance = nodemon({script: entry, flags: [], nodeArgs: [`--debug=${config.dev.serverDebugPort}`]})
            .on('quit', process.exit);

        process.on('uncaughtException', function(err) {
            console.log(err);
            nodemonInstance.emit('quit');
        });
    });

    let compileRequested = false;
    let onWatch = () => {
        if (compileRequested) return;

        compileRequested = true;

        _.delay(() => {
            compile(() => {
                compileRequested = false;
                nodemonInstance.emit('restart');
            });
        }, 200);
    };

    watcher.on('ready', () => {
        watcher
            .on('add', onWatch)
            .on('addDir', onWatch)
            .on('change', onWatch)
            .on('unlink', onWatch)
            .on('unlinkDir', onWatch)
    })
}

dev();