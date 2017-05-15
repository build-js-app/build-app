import * as _ from 'lodash';

import utils from '../helpers/utils';
import pathHelper from '../helpers/pathHelper';
import config from '../config/config';
import envHelper from '../helpers/envHelper';
import packagesHelper from '../helpers/packagesHelper';

export default {
    command: 'install [package]',
    describe: 'Install project dependencies',
    aliases: ['i'],
    handler: commandHandler,
    builder: commandBuilder,
    installAll
};

function commandBuilder(yargs) {
    return yargs
        .option('server', {
            alias: 's',
            boolean: true,
            description: 'install to server'
        })
        .option('client', {
            alias: 'c',
            boolean: true,
            description: 'install to client'
        })
        .example('install', 'install all dependencies for server/client, check global dependencies')
        .example('install lodash -s', 'install lodash to server')
        .example('install jquery -c', 'install jquery to client');
}

function commandHandler(argv) {
    envHelper.checkFolderStructure();

    if (!argv.package) {
        return installAll();
    }

    //TODO demand -s or -c
    let target = 'server';

    if (argv.client) {
        target = 'client';
    }

    return installPackage(argv.package, target);
}

function installAll() {
    try {
        checkGlobalDependencies();
    } catch (err) {
        //TODO
        utils.log('Cannot check global dependencies.', 'red');
    }

    let commandInfo = packagesHelper.getInstallPackagesCommand();

    utils.runCommand(commandInfo.command, commandInfo.params, {
        title: 'Install server dependencies',
        path: pathHelper.projectRelative(config.paths.server.root),
        showOutput: true
    });

    utils.runCommand(commandInfo.command, commandInfo.params, {
        title: 'Install client dependencies',
        path: pathHelper.projectRelative(config.paths.client.root),
        showOutput: true
    });
}

function checkGlobalDependencies() {
    let getGlobalDependencies = (packagePath) => {
        return utils.readJsonFile(packagePath).globalDependencies;
    };

    let serverDependencies = getGlobalDependencies(pathHelper.serverRelative('./package.json'));
    let clientDependencies = getGlobalDependencies(pathHelper.clientRelative('./package.json'));

    if (_.isEmpty(serverDependencies) && _.isEmpty(clientDependencies)) return;

    let serverDependenciesToInstall = envHelper.detectMissingGlobalDependencies(serverDependencies);
    let clientDependenciesToInstall = envHelper.detectMissingGlobalDependencies(clientDependencies);

    let dependenciesToInstall = _.merge(serverDependenciesToInstall, clientDependenciesToInstall);

    envHelper.reportMissingGlobalDependencies(dependenciesToInstall);
}

function installPackage(packageName, target) {
    let commandInfo = packagesHelper.getInstallPackageCommand(packageName);

    let folder = target === 'server' ? pathHelper.serverRelative('./')
        : pathHelper.clientRelative('./');

    utils.runCommand(commandInfo.command, commandInfo.params, {
        title: `Install package '${packageName}' into ${target}`,
        path: folder
    });
}