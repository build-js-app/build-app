import * as fs from 'fs-extra';
import * as webpack from 'webpack';
import * as chalk from 'chalk';

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

    buildServer(() => {
        buildClient();

        utils.log('Copying assets...');

        copyDataFolder();

        //index file to run app with production env params
        utils.copy(pathHelper.rootRelative('./templates/general/serverIndex.js'), './index.js');

        var endTime = new Date();
        var compilationTime = utils.getFormattedTimeInterval(startTime, endTime);

        utils.log('All Done!', 'green');
        utils.log('Compilation time: ' + chalk.cyan(compilationTime) + '.');

        if (config.server.run) {
            if (!config.server.bundleNodeModules) {
                utils.log('Installing dependencies...');

                utils.runCommand('npm', ['install'], {
                    path: pathHelper.packageRelative('.'),
                    errorMessage: 'Cannot install app dependencies',
                    successMessage: 'Done.'
                })
            }

            utils.log('Starting server...');

            utils.runCommand('node', ['index.js'], {
                path: pathHelper.packageRelative('.')
            });
        }
    });
}

function buildServer(cb) {
    console.log('Creating server bundle...');

    if (config.server.sourceLang === 'ts') {
        utils.runCommand('tsc', [], {
            path: pathHelper.appRelative('./server'),
            errorMessage: 'Cannot compile TypeScript',
            successMessage: 'TypeScript was compiled.'
        });
    }

    var webpackConfig = require('./../webpack/webpack.config.server.js');

    webpackConfig.entry.push(pathHelper.appRelative(config.paths.serverEntry));

    webpackConfig.output.path = pathHelper.appRelative('./server/build');

    webpackConfig.resolveLoader.root = pathHelper.rootRelative('node_modules');
    webpackConfig.resolve.fallback = pathHelper.rootRelative('node_modules');

    if (!config.server.bundleNodeModules) {
        var nodeModules = {};
        var nodeModulesPath = pathHelper.appRelative('./server/node_modules');
        fs.readdirSync(nodeModulesPath)
            .filter(function(x) {
                return ['.bin'].indexOf(x) === -1;
            })
            .forEach(function(mod) {
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

        utils.copy(config.paths.serverBundle, './server/server.js');

        var serverPackagePath = pathHelper.appRelative('./server/package.json');
        var serverPackageJson = fs.readJsonSync(serverPackagePath);

        var buildPackageJson = {
            dependencies: serverPackageJson.dependencies
        };

        fs.outputJsonSync(pathHelper.packageRelative('./package.json'), buildPackageJson);

        utils.log('Done.', 'green');

        if (cb) {
            cb();
        }
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
    utils.log('Copy client build (should be created already)...');

    utils.copy(config.paths.clientBuild, './client');

    if (removeMapFiles) {
        let files = fs.walkSync(pathHelper.packageRelative('./client'));
        for (let file of files) {
            if (file.endsWith('.map')) {
                fs.removeSync(file);
            }
        }
    }

    utils.log('Done.', 'green')
}

function copyDataFolder() {
    utils.ensureEmptyDir(pathHelper.packageRelative('./data/config'));

    utils.copy('./server/data/', './data/');

    let localDataPath = pathHelper.packageRelative('./data/local');

    //TODO do not copy
    fs.removeSync(localDataPath);
}

build();