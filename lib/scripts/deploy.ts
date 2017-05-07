import * as fs from 'fs-extra';
import * as Promise from 'bluebird';
import * as _ from 'lodash';
import * as klawSync from 'klaw-sync';

import pathHelper from './../helpers/pathHelper';
import utils from './../helpers/utils';
import envHelper from '../helpers/envHelper';
import config from '../config/config';
import packagesHelper from '../helpers/packagesHelper';
import installModule from '../scripts/install';
import buildModule from '../scripts/build';

export default {
    command: 'deploy',
    describe: 'Deploy project for production',
    handler: commandHandler,
    builder: commandBuilder
};

function commandBuilder(yargs) {
    return yargs;
}

function commandHandler(argv) {
    envHelper.checkFolderStructure();

    ensureBuild()
        .then(() => {
            deploy();
        });
}

function deploy() {
    let processManger = detectProcessManager();
    let appName = envHelper.getAppName();
    let deployDir = pathHelper.projectRelative(config.paths.deploy.root);
    let buildDir = pathHelper.projectRelative(config.paths.build.root);

    if (fs.existsSync(deployDir)) {
        stopApp(processManger, appName);
    }

    utils.logOperation('Copy build assets', () => {
        let isFirstDeploy = !fs.existsSync(deployDir);

        if (isFirstDeploy) {
            utils.ensureEmptyDir(deployDir);
        } else {
            let localDir = pathHelper.deployRelative(config.paths.server.local);
            let folderItem = klawSync(pathHelper.deployRelative('./'));
            for (let item of folderItem) {
                //skip local folder
                if (_.startsWith(item.path, localDir)) continue;

                fs.removeSync(item.path);
            }
        }

        fs.copySync(buildDir, deployDir);
    });

    //install packages there
    let installCommand = packagesHelper.getInstallPackagesCommand();
    utils.runCommand(installCommand.body, installCommand.params, {
        title: 'Install production dependencies',
        path: deployDir,
    });

    startApp(processManger, appName);
}

function ensureBuild() {
    return Promise.resolve(null);

    installModule.installAll();

    return buildModule.build();
}

function detectProcessManager() {
    let processManager = packagesHelper.findGlobalCommandByPrecedence(['pm2', 'forever']);

    if (!processManager) {
        utils.logAndExit(`Install globally one of supported process managers: forever or pm2.`);
    }

    return processManager;
}

function stopApp(processManager, appName) {
    let params = ['stop', appName];

    utils.runCommand(processManager, params, {
        path: pathHelper.projectRelative(config.paths.deploy.root),
        ignoreError: true,
        showOutput: false
    });
}

function startApp(processManager, appName) {
    let params = [];

    if (processManager === 'forever') {
        params = ['start', '--id',  appName, 'index.js'];
    }

    if (processManager === 'pm2') {
        params = ['start', 'index.js', '--name', appName];
    }

    utils.runCommand(processManager, params, {
        title: 'Start process',
        path: pathHelper.projectRelative(config.paths.deploy.root)
    });
}