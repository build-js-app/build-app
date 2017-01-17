import * as fs from 'fs-extra';
initEnvVars();

import * as webpack from 'webpack';
import * as chalk from 'chalk';
import * as Promise from 'bluebird';
import webpackConfig from '../config/webpack.config.server';
import webpackHelper from '../helpers/webpackHelper';
import pathHelper from './../helpers/pathHelper';
import utils from './../helpers/utils';
import config from '../config/config';

function initEnvVars() {
    if (!process.env.APP_DIR) {
        process.env.APP_DIR = fs.realpathSync(process.cwd());
    }
    process.env.NODE_ENV = 'production';
}

function build() {
    let startTime = new Date();

    utils.log('Build project in ' + chalk.cyan(pathHelper.getAppPath()) + '.');

    utils.ensureEmptyDir(config.paths.buildPackage);

    buildServer()
        .then(() => {
            return buildClient();
        })
        .then(() => {
            utils.log('Post build:');

            utils.logOperation('Copying data folder', () => {
                copyDataFolder();

                //index file to run app with production env params
                utils.copy(pathHelper.rootRelative('./templates/general/serverIndex.js'), './index.js');
            });

            let endTime = new Date();
            let compilationTime = utils.getFormattedTimeInterval(startTime, endTime);

            utils.log('Build package was crated!', 'green');
            utils.log('Compilation time: ' + chalk.cyan(compilationTime) + '.');

            if (config.server.run) {
                if (!config.server.bundleNodeModules) {
                    utils.log('Installing dependencies...');

                    utils.runCommand('npm', ['install'], {
                        path: pathHelper.packageRelative('.'),
                        title: 'Installing app dependencies'
                    })
                }

                utils.log('Starting server...');

                utils.runCommand('node', ['index.js'], {
                    path: pathHelper.packageRelative('.')
                });
            }
        });
}

function buildServer() {
    console.log('Server build:');

    if (config.server.sourceLang === 'ts') {
        utils.runCommand('tsc', [], {
            path: pathHelper.appRelative('./server'),
            title: 'Compiling TypeScript'
        });
    }

    let buildServerJsAction = new Promise((resolve, reject) => {
        buildServerJs(() => {
            resolve();
        })
    });

    return utils.logOperationAsync('Transpiling JavaScript', buildServerJsAction)
        .then(() => {
            utils.logOperation('Copying assets', () => {
                utils.copy(config.paths.serverBundle, './server/server.js');

                let serverPackagePath = pathHelper.appRelative('./server/package.json');
                let serverPackageJson = fs.readJsonSync(serverPackagePath);

                let buildPackageJson = {
                    dependencies: serverPackageJson.dependencies
                };

                fs.outputJsonSync(pathHelper.packageRelative('./package.json'), buildPackageJson);
            });
        });
}

function buildServerJs(callback) {
    let config = webpackConfig.load();

    webpack(config).run((err, stats) => {
        webpackHelper.handleErrors(err, stats, true);

        if (callback) callback();
    });
}

function buildClient() {
    utils.log('Build client:');

    utils.log(`Build client... ${chalk.yellow('skipped')}.`);

    utils.logOperation('Copying assets', () => {
        utils.copy(config.paths.clientBuild, './client');

        if (config.postBuild.removeMapFiles) {
            let files = fs.walkSync(pathHelper.packageRelative('./client'));
            for (let file of files) {
                if (file.endsWith('.map')) {
                    fs.removeSync(file);
                }
            }
        }
    });

    return Promise.resolve();
}

function copyDataFolder() {
    utils.ensureEmptyDir(pathHelper.packageRelative('./data/config'));

    utils.copy('./server/data/', './data/');

    let localDataPath = pathHelper.packageRelative('./data/local');

    //TODO do not copy
    fs.removeSync(localDataPath);
}

build();