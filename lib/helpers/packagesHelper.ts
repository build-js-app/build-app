import utils from './utils';

export default {
    getInstallPackagesCommand,
    getInstallPackageCommand
};

const packageManagers = ['pnpm', 'yarn', 'npm'];

function getInstallPackagesCommand() {
    let command = utils.findGlobalCommandByPrecedence(packageManagers);
    let params = [];

    switch (command){
        case 'npm':
            params = ['install'];
            break;
        case 'pnpm':
            params = ['install', '--no-lock'];
            break;
        case 'yarn':
            params = ['--no-lockfile'];
            break;
    }

    return {
        command,
        params
    };
}

function getInstallPackageCommand(packageName) {
    let command = utils.findGlobalCommandByPrecedence(packageManagers);
    let params = [];

    switch (command){
        case 'npm':
            params = ['install', packageName, '--save', '--save-exact'];
            break;
        case 'pnpm':
            params = ['install', packageName, '--save', '--save-exact', '--no-lock'];
            break;
        case 'yarn':
            params = ['add', packageName, '--no-lockfile', '--exact'];
            break;
    }

    return {
        command,
        params
    };
}