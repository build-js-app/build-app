import * as fs from 'fs-extra';
import * as webpack from 'webpack';
import * as chalk from 'chalk';
import * as Promise from 'bluebird';

if (!process.env.APP_DIR) {
    process.env.APP_DIR = fs.realpathSync(process.cwd());
}
process.env.NODE_ENV = 'production';

import pathHelper from './../helpers/pathHelper';
import utils from './../helpers/utils';
import config from './../config';

var removeMapFiles = true;

function build() {
    var startTime = new Date();

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
    let webpackConfig = require('./../webpack/webpack.config.server.js');

    webpackConfig.entry.push(pathHelper.appRelative(config.paths.serverEntry));

    webpackConfig.output.path = pathHelper.appRelative('./server/build');

    webpackConfig.resolveLoader.root = pathHelper.rootRelative('node_modules');
    webpackConfig.resolve.fallback = pathHelper.rootRelative('node_modules');

    if (!config.server.bundleNodeModules) {
        let nodeModules = {};
        let nodeModulesPath = pathHelper.appRelative('./server/node_modules');
        fs.readdirSync(nodeModulesPath)
            .filter(function (x) {
                return ['.bin'].indexOf(x) === -1;
            })
            .forEach(function (mod) {
                nodeModules[mod] = 'commonjs ' + mod;
            });

        webpackConfig.externals = nodeModules;
    }

    webpack(webpackConfig).run((err, stats) => {
        if (err) {
            printErrors('Failed to compile.', [err]);
            process.exit(1);
        }

        if (stats.compilation.errors.length) {
            printErrors('Failed to compile.', stats.compilation.errors);
            process.exit(1);
        }

        if (process.env.CI && stats.compilation.warnings.length) {
            printErrors('Failed to compile.', stats.compilation.warnings);
            process.exit(1);
        }

        if (callback) callback();
    });
}

// Print out errors
function printErrors(summary, errors) {
    utils.log(summary, 'red');
    utils.log();
    errors.forEach(err => {
        utils.log(err.message || err);
        utils.log();
    });
}

function buildClient() {
    utils.log('Build client:');

    utils.log(`Build client... ${chalk.yellow('skipped')}.`);

    utils.logOperation('Copying assets', () => {
        utils.copy(config.paths.clientBuild, './client');

        if (removeMapFiles) {
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