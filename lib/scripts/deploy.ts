import * as fs from 'fs-extra';
import * as chalk from 'chalk';
import * as dateFns from 'date-fns';

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
            description: 'Stop running application process for local deployment'
        })
        .option('target', {
            alias: 't',
            description: 'Deployment target, supported targets are heroku/now/local, local is deafult'
        })
        .option('remote', {
            alias: 'r',
            description: 'For heroku only, specify remote name, heroku by default'
        })
        .option('skip-client-build', {
            alias: 'scb',
            description: 'Skip client build'
        })
        .example('deploy', 'Deploy project for production (starts project with one of supported process managers).')
        .example('deploy --stop', 'Stop running app (it is removed from process list and cannot be restarted again).')
        .example('deploy -t heroku -r dev', 'Deploys app to heroku server using dev remote.');
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

    let target = 'local';
    if (argv.target) {
        //TODO check target is one of supported values
        target = argv.target;

        if (target === 'heroku') {
            if (!argv.remote) {
                utils.logAndExit('Specify remote for heroku deployments');
            }
        }
    }

    ensureBuild(argv.skipClientBuild)
        .then(() => {
            deploy(target, processManger, appName, argv.remote);
        });
}

function deploy(target, processManager, appName, remote) {

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
            let gitDir = `!${deployDir}/.git`;

            utils.clearDir(deployDir, [localDir, gitDir]);
        }

        fs.copySync(buildDir, deployDir);
    });

    switch (target){
        case 'local':
            //install packages there
            let installCommandInfo = packagesHelper.getInstallPackagesCommand();
            utils.runCommand(installCommandInfo.command, installCommandInfo.params, {
                title: 'Install production dependencies',
                path: deployDir,
            });

            startApp(processManager, appName);
            break;
        case 'heroku':
            utils.runCommand('git', ['checkout', remote], {
                title: `Switch to "${remote}" branch`,
                path: deployDir
            });

            utils.runCommand('git', ['pull', remote], {
                title: `Pull changes from remote`,
                path: deployDir
            });

            utils.runCommand('git', ['add', '.'], {
                title: 'Add files to git',
                path: deployDir
            });

            utils.runCommand('git', ['commit', '-m', `"Deployment at ${dateFns.format(new Date(), 'YYYY-MM-DDTHH:mm:ss')}"`], {
                title: 'Commit files to git',
                ignoreError: true,
                path: deployDir
            });

            utils.runCommand('git', ['push', remote, `${remote}:master`], {
                title: 'Deploying to Heroku...',
                showOutput: true,
                path: deployDir
            });
            break;
        default:
            throw new Error(`Unsupported target: "${target}"`);
            break;
    }
}

function ensureBuild(skipClientBuild) {
    //return Promise.resolve(null);

    installModule.installAll();

    return buildModule.build({
        skipClientBuild
    });
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