import * as fs from 'fs-extra';
import * as _ from 'lodash';

import utils from './utils';
import config from '../config/config';
import pathHelper from  '../helpers/pathHelper';

export default {
    checkTypeScript,
    checkFolderStructure,
    checkDependenciesInstalled,
    checkClientBuildWasGenerated,
    getServerEntry,
    getTsBuildEntry,
    isTsServerLang,
    isJsServerLang
}

let serverEntry = detectEntry();

function checkTypeScript() {
    if (!utils.commandExists('tsc')) {
        utils.log('TypeScript is not installed globally.', 'red');
        utils.log(`Use 'npm install -g typescript'`);
        process.exit(0);
    }
}

function checkFolderStructure() {
    let logError = (message) => {
        utils.log('Wrong project structure.', 'red');
        utils.log(message);
        utils.logAndExit('Make sure current directory is correct project folder.')
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
    return _.endsWith(serverEntry, '.ts');
}

function isJsServerLang() {
    return _.endsWith(serverEntry, '.js');
}

function getServerEntry() {
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
    let logError = (message) => {
        utils.log(message, 'red');
        utils.logAndExit('Please make sure that you have installed server/client dependencies. Run app-scripts install.')
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
    let logError = (message) => {
        utils.log(message, 'red');
        utils.logAndExit('Please make sure that you have built the client. Run app-scripts build.')
    };

    let clientBuild = pathHelper.clientRelative(config.paths.client.build);
    if (!utils.dirHasContent(clientBuild)) {
        logError('Client build folder has not been generated.');
    }
}