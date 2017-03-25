import helper from './_scriptsHelper';
helper.initEnv();

import * as _ from 'lodash';
import * as globby from 'globby';
import * as semver from 'semver';

import utils from '../helpers/utils';
import pathHelper from '../helpers/pathHelper';
import config from '../config/config';

function install() {
    let args = process.argv.slice(2);

    if (!args.length) {
        return installAll();
    }

    let message = `Not valid 'install' script arguments.`;

    let target = args[0];
    let packageName = args[1];

    if (!packageName) {
        utils.logAndExit(message);
    }

    if (target === 'server') {
        return installPackage(packageName, target);
    }

    if (target === 'client') {
        return installPackage(packageName, target);
    }

    utils.logAndExit(message);
}

function installAll() {
    try {
        checkGlobalDependencies();
    } catch (err) {
        //TODO
        utils.log('Cannot check global dependencies.', 'red');
    }

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

function checkGlobalDependencies() {
    let getGlobalDependencies = (packagePath) => {
        let globalDependencies = utils.readJsonFile(packagePath).globalDependencies;

        if (!globalDependencies) return [];

        return _.map(Object.keys(globalDependencies), key => {
            return {
                name: key,
                version: globalDependencies[key]
            };
        });
    };

    let serverDependencies = getGlobalDependencies(pathHelper.serverRelative('./package.json'));
    let clientDependencies = getGlobalDependencies(pathHelper.clientRelative('./package.json'));

    if (!serverDependencies.length && !clientDependencies.length) return;

    let globalPackages = getGlobalPackagesInfo();

    let dependenciesToInstall = {};
    let checkDependencies = (dependencies) => {
        for (let dependency of dependencies) {
            let installed = true;

            if (!globalPackages[dependency.name]) {
                installed = false;
            } else {
                if (!dependency.version) {
                    utils.logAndExit(`Global dependency version for ${dependency.name} should not be empty.`);
                }

                if (!semver.valid(dependency.version)) {
                    utils.logAndExit(`Invalid global dependency version: ${dependency.name}: ${dependency.version}`);
                }

                if (semver.gt(dependency.version, globalPackages[dependency.name])) {
                    installed = false;
                }
            }

            if (!installed) {
                dependenciesToInstall[dependency.name] = true;
            }
        }
    };

    checkDependencies(serverDependencies);
    checkDependencies(clientDependencies);

    if (!_.isEmpty(dependenciesToInstall)) {
        let packagesStr = Object.keys(dependenciesToInstall).join(' ');

        utils.log(`Some of global dependencies should be installed/updated.`);
        utils.log(`Please run following command manually and run 'install' script again.`);
        utils.logAndExit(`npm install -g ${packagesStr}`, 'cyan');
    }

}

function getGlobalPackagesInfo() {
    let globalModules = require('global-modules');

    const GLOBBY_PACKAGE_JSON = '{*/package.json,@*/*/package.json}';
    const installedPackages = globby.sync(GLOBBY_PACKAGE_JSON, {cwd: globalModules});

    let result = _(installedPackages)
        .map(pkgPath => {
            let pkg = utils.readJsonFile(pathHelper.path.resolve(globalModules, pkgPath));
            return [pkg.name, pkg.version];
        })
        .fromPairs()
        .valueOf();

    return result;
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

