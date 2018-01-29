import utils from './utils';
import config, {packageManagers} from '../config/config';

export default {
  getInstallPackagesCommand,
  getInstallPackageCommand
};

function getInstallPackagesCommand(packageManager = null) {
  let command = getCommand(packageManager);

  let params = [];

  switch (command) {
    case 'npm':
      params = ['install'];
      break;
    case 'pnpm':
      params = ['install'];
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

function getInstallPackageCommand(packageName, isDevDependency, packageManager) {
  let command = getCommand(packageManager);

  let params = [];

  switch (command) {
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

  if (isDevDependency) {
    params.push('-D'); //the same for all managers
  }

  return {
    command,
    params
  };
}

function getCommand(packageManager) {
  if (!packageManager) packageManager = config.packageManager;
  let commands = packageManager ? [packageManager] : packageManagers;

  return utils.findGlobalCommandByPrecedence(commands);
}
