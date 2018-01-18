import * as yargs from 'yargs';
import * as fs from 'fs-extra';
import * as os from 'os';

initEnvVars();

import pathHelper from './helpers/pathHelper';
import initModule from './scripts/init';
import installModule from './scripts/install';
import buildModule from './scripts/build';
import serveModule from './scripts/serve';
import deployModule from './scripts/deploy';
import extrasModule from './scripts/extras';
import seedModule from './scripts/seed';

let commands = ['init', 'install', 'build', 'serve', 'deploy'];

let epilog = [
  'You can see specific help for each command. Run app-scripts <command> --help.',
  'You can use napp as shorter alias for app-scripts.'
].join(os.EOL);

let pkg = fs.readJSONSync(pathHelper.moduleRelative('./package.json'));

yargs
  .usage('Usage: app-scripts <command> [options]')
  .command(initModule)
  .command(installModule)
  .command(buildModule)
  .command(serveModule)
  .command(deployModule)
  .command(extrasModule)
  .command(seedModule)
  .command(
    '*',
    '',
    () => {},
    argv => {
      let command = argv.command;

      if (!command) {
        console.log('Please, specify valid command name.');
        logAvailableCommands();
      } else {
        console.log(`Unknown command "${command}".`);
        console.log('Perhaps you need to update app-scripts?');
        logAvailableCommands();
      }
    }
  )
  .help()
  .alias('h', 'help')
  .epilog(epilog)
  .version(pkg.version).argv;

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
