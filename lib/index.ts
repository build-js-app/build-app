import * as yargs from 'yargs';
import * as fs from 'fs-extra';

initEnvVars();

import initModule from './scripts/init';
import installModule from './scripts/install';
import buildModule from './scripts/build';
import serveModule from './scripts/serve';

let commands = ['init', 'install', 'build', 'serve'];

yargs
    .usage('Usage: app-scripts <command> [options]')
    .command(initModule)
    .command(installModule)
    .command(buildModule)
    .command(serveModule)
    .command('*', '', () => {
        },
        (argv) => {
            let command = argv.command;

            if (!command) {
                console.log('Please, specify valid command name.');
                logAvailableCommands();
            } else {
                console.log(`Unknown command "${command}".`);
                console.log('Perhaps you need to update app-scripts?');
                logAvailableCommands();
            }
        })
    .help()
    .alias('h', 'help')
    .epilog(`You can see specific help for each command. Run app-scripts <command> --help.`)
    .argv;

function logAvailableCommands() {
    console.log(`Available options are: ${commands.join(', ')}.`);
    console.log('Run app-scripts with --help option to see available commands.');
}

function initEnvVars() {
    if (!process.env.APP_DIR) {
        process.env.APP_DIR = fs.realpathSync(process.cwd());
    }
    process.env.NODE_ENV = 'production';
}