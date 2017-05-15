import config from '../config/config';
import utils from '../helpers/utils';
import pathHelper from '../helpers/pathHelper';
import envHelper from '../helpers/envHelper';

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
    envHelper.checkFolderStructure();
    envHelper.checkDependenciesInstalled();
    envHelper.checkClientBuildWasGenerated();

    let target = 'server';
    if (argv.client) {
        target = 'client';
    }

    switch (target) {
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
    utils.clearConsole();

    //TODO use babel-node
    if (envHelper.isJsServerLang()) {
        return utils.runCommand('npm', ['run', 'start'], {
                title: 'Serve server',
                path: pathHelper.serverRelative('./'),
                showOutput: true,
            }
        );
    }

    //TODO move versions to config
    let missingGlobalDependencies = envHelper.detectMissingGlobalDependencies({
        'ts-node': '3.0.2',
        'nodemon': '1.11.0'
    });

    envHelper.reportMissingGlobalDependencies(missingGlobalDependencies);

    let debugMode = envHelper.isUsingVsCode() ? 'inspect' : 'debug';
    let entry = envHelper.getServerEntry();

    utils.runCommand('nodemon', ['--watch', 'src', '--exec', 'ts-node', `--${debugMode}=${config.server.dev.debugPort}`, entry], {
        title: 'Serve server',
        path: pathHelper.serverRelative('./'),
        showOutput: true,
        env: {
            TS_NODE_COMPILER_OPTIONS: JSON.stringify({
                inlineSourceMap: true
            })
        }
    });
}

function serveClient() {
    utils.clearConsole();
    utils.runCommand('npm', ['run', 'start'], {
        title: 'Serve client',
        path: pathHelper.clientRelative('./'),
        showOutput: true
    });
}
