import utils from './utils';

export default {
    getInstallPackagesCommand,
    findGlobalCommandByPrecedence
}

function getInstallPackagesCommand() {
    let body = findGlobalCommandByPrecedence(['pnpm', 'yarn', 'npm']);
    let params = [];

    switch (body){
        case 'npm':
        case 'pnpm':
            params = ['install'];
            break;
        case 'yarn':
            params = ['--no-lockfile'];
            break;
    }

    return {
        body,
        params
    }
}

function findGlobalCommandByPrecedence(commands) {
    for (let command of commands) {
        if (utils.commandExists(command)) return command;
    }

    return null;
}