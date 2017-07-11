(process as any).noDeprecation = true;

import * as fs from 'fs-extra';
import * as webpack from 'webpack';
import * as chalk from 'chalk';
import * as klawSync from 'klaw-sync';
import * as del from 'del';

import webpackConfigLoader from '../config/webpackConfigLoader';
import webpackHelper from '../helpers/webpackHelper';
import pathHelper from './../helpers/pathHelper';
import utils from './../helpers/utils';
import envHelper from '../helpers/envHelper';
import config from '../config/config';

export default {
    command: 'build',
    describe: 'Build project for production',
    handler: commandHandler,
    builder: commandBuilder,
    build
};

function commandBuilder(yargs) {
    return yargs;
}

async function commandHandler(argv) {
    envHelper.checkFolderStructure();
    envHelper.checkDependenciesInstalled();

    await build();
}

async function build() {
    let startTime = new Date();

    utils.log('Build project in ' + chalk.cyan(pathHelper.getAppPath()) + '.');

    let buildDir = config.paths.build.root;
    utils.ensureEmptyDir(buildDir);

    await buildServer();

    buildClient();

    utils.log('Post build:');

    utils.logOperation('Copying data folder', () => {
        copyDataFolder();

        //index file to run app with production env params
        utils.copyToPackage(pathHelper.moduleRelative('./assets/build/serverIndex.js'), './index.js');
    });

    let endTime = new Date();
    let compilationTime = utils.getFormattedTimeInterval(startTime, endTime);

    utils.log('Build package was created!', 'green');
    utils.log('Compilation time: ' + chalk.cyan(compilationTime) + '.');

    if (config.postBuild.archive) {
        let archive = utils.archiveFolder(pathHelper.buildRelative('./'), pathHelper.buildRelative('./build.zip'));

        return utils.logOperation('Archive build package', archive);
    }
}

function buildServer() {
    utils.log('Server build:', 'green');

    if (envHelper.isTsServerLang()) {
        envHelper.checkTypeScript();

        utils.runCommand('tsc', [], {
            path: pathHelper.serverRelative('./'),
            title: 'Compiling TypeScript',
            showOutput: true
        });
    }

    let buildServerJsAction = new Promise((resolve, reject) => {
        buildServerJs(() => {
            resolve();
        });
    });

    return utils.logOperation('Transpiling JavaScript', buildServerJsAction)
        .then(() => {
            utils.logOperation('Copying assets', () => {
                utils.copyToPackage(pathHelper.serverRelative(config.paths.server.bundle), './server/server.js');

                let serverPackagePath = pathHelper.serverRelative('./package.json');
                let serverPackageJson = utils.readJsonFile(serverPackagePath);

                let rootPackagePath = pathHelper.projectRelative('./package.json');
                let rootPackage = utils.readJsonFile(rootPackagePath);

                let buildPackageJson = {
                    name: rootPackage.name,
                    version: rootPackage.version,
                    scripts: {
                        start: 'node index.js'
                    },
                    dependencies: serverPackageJson.dependencies
                };

                fs.outputJsonSync(pathHelper.buildRelative('./package.json'), buildPackageJson);
            });
        });
}

function buildServerJs(callback) {
    let webpackConfig = null;

    if (envHelper.isTsServerLang()) {
        webpackConfig = webpackConfigLoader.loadWebpackConfig('ts_prod');
    } else {
        webpackConfig = webpackConfigLoader.loadWebpackConfig('js_prod');
    }

    webpack(webpackConfig).run((err, stats) => {
        webpackHelper.handleErrors(err, stats, true);

        if (callback) callback();
    });
}

function buildClient() {
    utils.log('Client build:', 'green');

    let buildClient = true;

    if (buildClient) {
        utils.runCommand('npm', ['run', 'build'], {
            title: 'Build client',
            path: pathHelper.clientRelative('./')
        });
    } else {
        utils.log(`Build client... ${chalk.yellow('skipped')}.`);
    }

    utils.logOperation('Copying assets', () => {
        utils.copyToPackage(pathHelper.clientRelative(config.paths.client.build), './client');

        if (config.server.build.removeMapFiles) {
            let clientPath = pathHelper.buildRelative(config.paths.client.root);
            let files = klawSync(clientPath);
            for (let file of files) {
                if (file.path.endsWith('.map')) {
                    fs.removeSync(file.path);
                }
            }
        }
    });

    return Promise.resolve();
}

function copyDataFolder() {
    utils.copyToPackage(pathHelper.serverRelative(config.paths.server.data), './data/');

    utils.ensureEmptyDir(pathHelper.buildRelative('./data/config'));
}