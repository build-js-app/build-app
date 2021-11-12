import pathHelper from './../helpers/pathHelper';
import installModule from '../scripts/install';
import buildModule from '../scripts/build';
import utils from './../helpers/utils';
import config from '../config/config';
import envHelper from '../helpers/envHelper';
export default {
  command: 'seed',
  describe: 'Initial project setup: installs dependencies and seeds data',
  handler: commandHandler,
  builder: commandBuilder
};

function commandBuilder(yargs) {
  return yargs.example('seed', 'Initial project setup: installs dependencies and seeds data.');
}

async function commandHandler(argv) {
  envHelper.checkFolderStructure();

  installModule.installAll();

  await buildModule.build('full');

  utils.runCommand('node', [pathHelper.serverRelative(envHelper.getTsBuildEntry()), 'run', 'seed'], {
    title: 'Seed Data',
    path: pathHelper.buildRelative('./'),
    showOutput: true
  });
}
