import * as yargs from 'yargs';

let commands = ['init', 'install', 'build', 'serve'];

yargs
    .usage('Usage: app-scripts <command> [options]')
    .command('init', '')
    .command('install', '')
    .command('build', '')
    .command('serve', '')
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
    .argv;

function logAvailableCommands() {
    console.log(`Available options are: ${commands.join(', ')}.`);
    console.log('Run app-scripts with --help option to see available commands.');
}