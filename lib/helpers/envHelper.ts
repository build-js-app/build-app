import * as fs from 'fs-extra';

import utils from './utils';
import config from '../config/config';
import pathHelper from  '../helpers/pathHelper';


export default {
    checkTypeScript,
    checkFolderStructure
}

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