import * as fs from 'fs-extra';
import * as Promise from 'bluebird';
import * as _ from 'lodash';
import * as klawSync from 'klaw-sync';
import * as chalk from 'chalk';

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
    return yargs
        .option('stop', {
            description: 'Stop running application process'

        })
        .example('deploy', 'Deploy project for production (starts project with one of supported process managers).')
        .example('deploy --stop', 'Stop running app (it is removed from process list and cannot be restarted again).');
}

function commandHandler(argv) {
    envHelper.checkFolderStructure();

    let processManger = detectProcessManager();
    let appName = envHelper.getAppName();

    if (argv.stop) {
        return utils.logOperation(`Stop '${appName}' application process`, () => {
            stopApp(processManger, appName);
        });
    }

    ensureBuild()
        .then(() => {
            deploy(processManger, appName);
        });
}

function deploy(processManager, appName) {

    let deployDir = pathHelper.projectRelative(config.paths.deploy.root);
    let buildDir = pathHelper.projectRelative(config.paths.build.root);

    if (fs.existsSync(deployDir)) {
        stopApp(processManager, appName);
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
    let installCommandInfo = packagesHelper.getInstallPackagesCommand();
    utils.runCommand(installCommandInfo.command, installCommandInfo.params, {
        title: 'Install production dependencies',
        path: deployDir,
    });

    startApp(processManager, appName);
}

function ensureBuild() {
    //return Promise.resolve(null);

    installModule.installAll();

    return buildModule.build();
}

function detectProcessManager() {
    let processManager = utils.findGlobalCommandByPrecedence(['pm2', 'forever']);

    if (!processManager) {
        utils.logAndExit(`Install globally one of supported process managers: forever or pm2.`);
    }

    return processManager;
}

function stopApp(processManager, appName) {
    let params = [];

    if (processManager === 'forever') {
        params = ['stop', appName];
    }

    if (processManager === 'pm2') {
        params = ['delete', appName];
    }

    utils.runCommand(processManager, params, {
        path: pathHelper.projectRelative(config.paths.deploy.root),
        ignoreError: true,
        showOutput: false
    });
}

function startApp(processManager, appName) {
    let params = [];

    if (processManager === 'forever') {
        params = ['start', '--id', appName, 'index.js'];
    }

    if (processManager === 'pm2') {
        params = ['start', 'index.js', '--name', appName];
    }

    utils.runCommand(processManager, params, {
        title: 'Start process',
        path: pathHelper.projectRelative(config.paths.deploy.root)
    });

    utils.logAndExit(`Process has been started. By default it is available on ${chalk.cyan('localhost:5000')}.`);
}