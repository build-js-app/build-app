import * as _ from 'lodash';
import * as fs from 'fs-extra';

import utils from '../helpers/utils';
import pathHelper from '../helpers/pathHelper';
import config from '../config/config';
import envHelper from '../helpers/envHelper';
import packagesHelper from '../helpers/packagesHelper';

export default {
  command: 'extras [sub_command] [options]',
  describe: 'Additional commands (undocumented features)',
  handler: commandHandler,
  builder: commandBuilder
};

function commandBuilder(yargs) {
  return yargs
    .example('napp extras archive', 'Archive app sources')
    .example('napp extras package-list-global', 'Show global packages')
    .example('napp extras package-updates', 'Show updates');
}

async function commandHandler(argv) {
  switch (argv.sub_command) {
    case 'archive':
      envHelper.checkFolderStructure();
      await utils.logOperation('Archive app sources', archive);
      break;
    case 'package-list-global':
      await showGlobalPackages();
      break;
    case 'package-updates':
      runNpmCheckUpdates();
      break;
    default:
      utils.logAndExit('Run with --help parameter to see available options');
      break;
  }
}

async function archive() {
  let archiveDir = pathHelper.projectRelative(config.paths.archive.root);
  let archiveFileName = `${envHelper.getAppName()}_src.zip`;
  let archivePath = pathHelper.projectRelative(archiveFileName);

  utils.ensureEmptyDir(archiveDir);

  let exclude = [
    pathHelper.clientRelative(config.paths.client.build),
    pathHelper.projectRelative(config.paths.build.root),
    pathHelper.projectRelative(config.paths.deploy.root),
    pathHelper.projectRelative(config.paths.archive.root),
    pathHelper.serverRelative('./node_modules'),
    pathHelper.serverRelative(config.paths.server.build),
    pathHelper.serverRelative(config.paths.server.local),
    pathHelper.clientRelative('./node_modules'),
    archivePath
  ];

  fs.copySync(pathHelper.projectRelative('./'), archiveDir, {
    filter: path => {
      for (let excludePath of exclude) {
        if (_.startsWith(path, excludePath)) {
          return false;
        }
      }

      return true;
    }
  });

  await utils.archiveFolder(archiveDir, archivePath);

  utils.removeDir(archiveDir);
}

function showGlobalPackages() {
  let globalPackagesInfo = envHelper.getGlobalPackagesInfo();

  for (let packageName of Object.keys(globalPackagesInfo)) {
    let version = globalPackagesInfo[packageName];
    utils.log(`${packageName}: ${version}`);
  }
}

function runNpmCheckUpdates() {
  let checkerCommand = utils.findGlobalCommandByPrecedence(['npm-check', 'ncu']);

  if (!checkerCommand) {
    utils.logAndExit(`Please install 'npm-check-updates' or 'npm-check' package globally`);
  }

  utils.log('Server:', 'green');
  utils.runCommand(checkerCommand, [], {
    path: pathHelper.serverRelative('./'),
    showOutput: true
  });

  utils.log('Client:', 'green');
  utils.runCommand(checkerCommand, [], {
    path: pathHelper.clientRelative('./'),
    showOutput: true
  });

  utils.log('Note:', 'cyan');
  utils.log(`To upgrade server/client packages run '${checkerCommand} -u' in server/client folder`);
  checkerCommand;
}
