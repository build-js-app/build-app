import * as fs from 'fs-extra';
import * as webpack from 'webpack';
import * as chalk from 'chalk';
import * as _ from 'lodash';
import * as chokidar from 'chokidar';
import * as FriendlyErrorsWebpackPlugin from 'friendly-errors-webpack-plugin';
import * as spawn from 'cross-spawn';
import * as os from 'os';
import nodeRunner from '../helpers/nodeRunner';

import webpackConfigLoader from '../config/webpackConfigLoader';
import webpackHelper from '../helpers/webpackHelper';
import pathHelper from './../helpers/pathHelper';
import utils from './../helpers/utils';
import config from '../config/config';
import envHelper from '../helpers/envHelper';

const nodemon = require('nodemon');

function initEnvVars() {
    if (!process.env.APP_DIR) {
        process.env.APP_DIR = fs.realpathSync(process.cwd());
    }
    process.env.NODE_ENV = 'development';
}

function dev() {
    if (envHelper.isTsServerLang()) {
        devTs();
    } else {
        devJs();
    }
}

let output = [];
let scriptRunner = null;

function devTs() {
    //TODO duplication
    utils.clearConsole();
    utils.log('Starting new compilation...');

    let ts = spawn('tsc', ['--watch'], {
        cwd: pathHelper.serverRelative('./')
    });

    let compile = _.debounce(() => {
        tsCompileRequest()
    }, 200, {});

    ts.stdout.on('data', (data) => {
        let entry = _.trim(data.toString());
        let parts = entry.split(os.EOL);
        for (let part of parts) {
            output.push(_.trim(part));
        }
        compile();
    });

    ts.stderr.on('data', (data) => {
        console.log(`stderr: ${data}`);
    });

    ts.on('close', (code) => {
        console.log(`child process exited with code ${code}`);
    });

    let entry = envHelper.getTsBuildEntry();
    scriptRunner = nodeRunner.init(entry);
}

function tsCompileRequest() {
    let lastMessage = output[output.length - 1];

    if (_.endsWith(lastMessage, 'File change detected. Starting incremental compilation...')) {
        scriptRunner.stop();

        utils.clearConsole();
        utils.log('Starting new compilation...');

        return;
    }


    if (_.endsWith(lastMessage, 'Compilation complete. Watching for file changes.')) {
        let errors = [];

        for (let i = output.length - 2; i >= 0; i--) {
            if (!_.endsWith(output[i], 'File change detected. Starting incremental compilation...')) {
                errors.push(output[i]);
            } else {
                break;
            }
        }

        return onTsCompileComplete(errors);
    }
}

function onTsCompileComplete(errors) {
    _.delay(() => {
        if (errors.length === 0) {
            utils.log('Compiled successfully!', 'green');
            scriptRunner.start();
        } else {
            utils.log('Failed to compile.', 'red');
            for (let error of errors) {
                utils.log(error);
            }
        }
    }, 0);
}

function devJs() {
    let watchPath = pathHelper.serverRelative(config.paths.server.src);
    let watcher = chokidar.watch([watchPath]);

    let webpackConfig = webpackConfigLoader.loadWebpackConfig('js_dev');

    webpackConfig.plugins.push[new FriendlyErrorsWebpackPlugin()];

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
        let bundlePath = pathHelper.serverRelative(config.paths.server.bundle);
        nodemonInstance = nodemon({script: bundlePath, flags: [], nodeArgs: [`--debug=${config.server.dev.debugPort}`]})
            .on('quit', process.exit);

        process.on('uncaughtException', function (err) {
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