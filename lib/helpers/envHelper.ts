import * as fs from 'fs-extra';
import * as _ from 'lodash';
import * as globby from 'globby';
import * as semver from 'semver';

import utils from './utils';
import config from '../config/config';
import pathHelper from '../helpers/pathHelper';

export default {
    checkTypeScript,
    checkFolderStructure,
    checkDependenciesInstalled,
    checkClientBuildWasGenerated,
    detectMissingGlobalDependencies,
    reportMissingGlobalDependencies,
    getServerEntry,
    getTsBuildEntry,
    isTsServerLang,
    isJsServerLang,
    isUsingReact,
    isUsingVsCode,
    getAppName,
    checkNpmScriptExists
};

function checkTypeScript() {
    if (!utils.commandExists('tsc')) {
        utils.log('TypeScript is not installed globally.', 'red');
        utils.log(`Use 'npm install -g typescript'`);
        process.exit(0);
    }
}

function checkFolderStructure() {
    let logError = message => {
        utils.log('Wrong project structure.', 'red');
        utils.log(message);
        utils.logAndExit('Make sure current directory is correct project folder.');
    };

    let serverFolderExists = fs.existsSync(pathHelper.serverRelative('./'));

    if (!serverFolderExists) {
        logError('Server folder does not exists.');
    }

    //TODO check for entry file, other checks

    let clientFolderExists = fs.existsSync(pathHelper.clientRelative('./'));

    if (!clientFolderExists) {
        logError('Client folder does not exists.');
    }
}

function isTsServerLang() {
    let serverEntry = detectEntry();
    return _.endsWith(serverEntry, '.ts');
}

function isJsServerLang() {
    let serverEntry = detectEntry();
    return _.endsWith(serverEntry, '.js');
}

function getServerEntry() {
    let serverEntry = detectEntry();
    return serverEntry;
}

function detectEntry() {
    if (config.paths.server.entry) return pathHelper.serverRelative(config.paths.server.entry);

    let entryDir = pathHelper.serverRelative(config.paths.server.src);
    let entryTs = pathHelper.path.join(entryDir, 'index.ts');

    //look for TS entry first
    if (fs.existsSync(entryTs)) return entryTs;

    let entryJs = pathHelper.path.join(entryDir, 'index.js');
    if (fs.existsSync(entryJs)) return entryJs;

    return '';
}

function getTsBuildEntry() {
    let entryRelative = config.paths.server.entry;

    if (!entryRelative) {
        entryRelative = pathHelper.path.join(config.paths.server.src, './index.ts');
    }

    let entry = pathHelper.serverRelative(config.paths.server.build);
    entry = pathHelper.path.join(entry, entryRelative);

    //replace .ts extension with .js extension
    entry = entry.substr(0, entry.length - 3) + '.js';
    return entry;
}

function checkDependenciesInstalled() {
    let logError = message => {
        utils.log(message, 'red');
        utils.logAndExit(
            'Please make sure that you have installed server/client dependencies. Run app-scripts install.'
        );
    };

    let serverDependencies = pathHelper.serverRelative('./node_modules');
    if (!utils.dirHasContent(serverDependencies)) {
        logError('Server dependencies are not installed.');
    }

    let clientDependencies = pathHelper.clientRelative('./node_modules');
    if (!utils.dirHasContent(serverDependencies)) {
        logError('Client dependencies are not installed.');
    }
}

function checkClientBuildWasGenerated() {
    let logError = message => {
        utils.log(message, 'red');
        utils.logAndExit('Please make sure that you have built the client. Run app-scripts build.');
    };

    let clientBuild = pathHelper.clientRelative(config.paths.client.build);
    if (!utils.dirHasContent(clientBuild)) {
        logError('Client build folder has not been generated.');
    }
}

function isUsingReact() {
    let clientPkgPath = pathHelper.clientRelative('./package.json');
    let pkg = fs.readJsonSync(clientPkgPath);
    return pkg.dependencies && pkg.dependencies.react;
}

function isUsingVsCode() {
    return utils.dirHasContent(pathHelper.projectRelative('./.vscode'));
}

function detectMissingGlobalDependencies(dependenciesObj) {
    if (!dependenciesObj) return [];

    let dependencies = _.map(Object.keys(dependenciesObj), key => {
        return {
            name: key,
            version: dependenciesObj[key]
        };
    });

    let globalPackages = getGlobalPackagesInfo();

    let dependenciesToInstall = {};

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

    return dependenciesToInstall;
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

function reportMissingGlobalDependencies(dependenciesToInstall) {
    if (!_.isEmpty(dependenciesToInstall)) {
        let packagesStr = Object.keys(dependenciesToInstall).join(' ');

        utils.log(`Some of global dependencies should be installed/updated.`);
        utils.log(`Please run following command manually and run 'install' script again.`);
        utils.logAndExit(`npm install -g ${packagesStr}`, 'cyan');
    }
}

function getAppName() {
    let rootPkg = fs.readJsonSync(pathHelper.projectRelative('./package.json'));
    let result = rootPkg.name;
    if (!result) {
        utils.logAndExit(`Cannot find app name in package.json file.`);
    }
    return result;
}

function checkNpmScriptExists(location: 'client' | 'server', scriptName, shouldExist = false) {
    let packagePath =
        location === 'server'
            ? pathHelper.serverRelative('./package.json')
            : pathHelper.clientRelative('./package.json');
    let packageJson = fs.readJsonSync(packagePath);

    let result = true;

    if (!packageJson.scripts) {
        result = false;
    } else {
        if (!packageJson.scripts[scriptName]) result = false;
    }

    if (shouldExist && !result) {
        utils.logAndExit(`Script "${scriptName}" does not exist in ${location} package.json file.`);
    }

    return result;
}
