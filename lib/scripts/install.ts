import helper from './_scriptsHelper';
helper.initEnv();

import utils from '../helpers/utils';
import pathHelper from '../helpers/pathHelper';
import config from '../config/config';

function install() {
    let args = process.argv.slice(2);

    if (!args.length) {
        return installAll();
    }

    let message = `Not valid 'install' script arguments.`;
    let logAndExit = (message) => {
        utils.log(message);
        process.exit(0);
    };

    let target = args[0];
    let packageName = args[1];

    if (!packageName) {
        logAndExit(message);
    }

    if (target === 'server') {
        return installPackage(packageName, target);
    }

    if (target === 'client') {
        return installPackage(packageName, target);
    }

    logAndExit(message);
}

function installAll() {
    let command = 'npm';
    let params = ['install'];

    if (utils.commandExists('yarn')) {
        command = 'yarn';
        params = ['--no-lockfile'];
    }

    utils.runCommand(command, params, {
        title: 'Install server dependencies',
        path: pathHelper.projectRelative(config.paths.server.root)
    });

    utils.runCommand('npm', ['install'], {
        title: 'Install client dependencies',
        path: pathHelper.projectRelative(config.paths.client.root)
    });
}

function installPackage(packageName, target) {
    let command = 'npm';
    let params = ['install', packageName, '--save', '--save-exact'];

    if (utils.commandExists('yarn')) {
        command = 'yarn';
        params = ['add', packageName, '--no-lockfile'];
    }

    let folder = target === 'server' ? pathHelper.serverRelative('./')
        : pathHelper.clientRelative('./');

    utils.runCommand(command, params, {
        title: `Install package '${packageName}' into ${target}`,
        path: folder
    });
}

install();

