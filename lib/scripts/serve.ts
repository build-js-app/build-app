import utils from '../helpers/utils';
import pathHelper from '../helpers/pathHelper';

export default {
    command: 'serve',
    describe: 'Run in dev mode',
    aliases: ['s'],
    handler,
    builder
};

function builder(yargs) {
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
        .example('serve -s', 'runs server in dev mode')
        .example('serve -c', 'runs client in dev mode');
}

function handler(argv) {
    let target = 'server';
    if (argv.client) {
        target = 'client';
    }

    switch (target){
        case 'server':
            serveServer();
            break;
        case 'client':
            serveClient();
            break;
        default:
            break;
    }
}

function serveServer() {
    utils.runCommand('npm', ['run', 'start'], {
        path: pathHelper.serverRelative('./')
    });
}

function serveClient() {
    utils.runCommand('npm', ['run', 'start'], {
        path: pathHelper.clientRelative('./')
    });
}
