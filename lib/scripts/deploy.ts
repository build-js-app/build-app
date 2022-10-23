import * as fs from 'fs-extra';
import * as chalk from 'chalk';
import * as dateFns from 'date-fns';

import pathHelper from './../helpers/pathHelper';
import utils from './../helpers/utils';
import envHelper from '../helpers/envHelper';
import config from '../config/config';
import packagesHelper from '../helpers/packagesHelper';
import installModule from '../scripts/install';
import buildModule from '../scripts/build';

export default {
  command: 'deploy [command]',
  describe: 'Deploy project for production',
  handler: commandHandler,
  builder: commandBuilder
};

const TARGET_HEROKU = 'heroku';
const TARGET_LOCAL = 'local';
const TARGET_NOW = 'now';
const COMMAND_STOP = 'stop';
const COMMAND_INIT = 'init';
const VALID_TARGETS = [TARGET_LOCAL, TARGET_HEROKU, TARGET_NOW];
const VALID_COMMANDS = [COMMAND_STOP, COMMAND_INIT];
const HEROKU_INSTANCE = 'heroku';

function commandBuilder(yargs) {
  return yargs
    .option('stop', {
      description: 'Stop running application process for local deployment'
    })
    .option('target', {
      alias: 't',
      description: 'Deployment target, supported targets are heroku/now/local, local is deafult'
    })
    .option('heroku-app', {
      alias: 'happ',
      description: 'For heroku only, specify Heroku App ID'
    })
    .option('skip-client-build', {
      alias: 'scb',
      description: 'Skip client build'
    })
    .example('deploy', 'Deploy project for production (starts project with one of supported process managers).')
    .example('deploy --stop', 'Stop running app (it is removed from process list and cannot be restarted again).')
    .example('deploy -t heroku -happ my-heroku-app', 'Deploys app to heroku with APP_ID: "my-heroku-app".');
}

async function commandHandler(argv) {
  envHelper.checkFolderStructure();

  let target = getTarget(argv);
  let appName = envHelper.getAppName();
  let processManager = null;

  if (target === TARGET_LOCAL && argv.stop) {
    processManager = detectProcessManager();
    return utils.logOperation(`Stop '${appName}' application process`, () => {
      stopLocalApp(processManager, appName);
    });
  }

  let deployDir = pathHelper.projectRelative(config.paths.deploy.root, target);
  let buildDir = pathHelper.projectRelative(config.paths.build.root);

  let deployParams = {
    target,
    appName,
    deployDir,
    buildDir,
    processManager,
    argv
  };

  try {
    utils.ensureEmptyDir(deployDir);

    beforeDeploy(deployParams);

    await ensureBuild(argv.skipClientBuild);

    utils.logOperation('Copy build assets', () => {
      let isFirstDeploy = !fs.existsSync(deployDir);

      if (isFirstDeploy) {
        utils.ensureEmptyDir(deployDir);
      } else {
        let localDir = pathHelper.deployRelative(config.paths.server.local);
        let gitDir = `!${deployDir}/.git`;
        let ignoreList = [localDir, gitDir];

        if (target === TARGET_NOW) {
          ignoreList.push('now.json');
        }

        utils.clearDir(deployDir, ignoreList);
      }

      fs.copySync(buildDir, deployDir);
    });

    afterDeploy(deployParams);
  } catch (err) {
    utils.logAndExit(err);
  }
}

function getTarget(argv) {
  let target = TARGET_LOCAL;

  if (argv.target) {
    utils.assertValueIsInTheList(argv.target, VALID_TARGETS, `Invalid deploy target.`);
    target = argv.target;

    if (target === TARGET_HEROKU) {
      if (!argv.herokuApp) {
        utils.logAndExit('Specify heroku APP ID for heroku deployments');
      }
    }
  }

  return target;
}

function beforeDeploy(deployParams) {
  const {target, processManager, appName, deployDir} = deployParams;

  switch (target) {
    case TARGET_LOCAL:
      stopLocalApp(processManager, appName);
      break;
    case TARGET_HEROKU:
      beforeDeployHeroku(deployParams);
      break;
    case TARGET_NOW:
      let nowConfig = getNowConfig(deployDir);
      let nowAppName = nowConfig.name;
      if (!nowAppName) utils.logAndExit('Specify now deployment name in now.json config.');

      utils.runCommand('now', ['rm', nowAppName, '-y'], {
        title: `Remove previous now deployments`,
        path: deployDir
      });
      break;
  }
}

function beforeDeployHeroku(deployParams) {
  const {deployDir, argv} = deployParams;

  const remoteHasMaster = () => {
    let output = utils.getCommandOutput('git', ['ls-remote', '--heads', HEROKU_INSTANCE, 'master'], deployDir);

    return output.output ? true : false;
  };

  const gitCommand = (args, title = '', allowError = false) =>
    utils.runCommand('git', args, {
      title,
      path: deployDir,
      ignoreError: true
    });

  gitCommand(['init']);
  gitCommand(['config', 'user.email', 'napp.heroku@gmail.com']);
  gitCommand(['config', 'user.name', 'Napp Deploy']);

  const herokuAppId = argv.herokuApp;
  if (!herokuAppId) {
    utils.logAndExit(
      'Specify Heroku App ID (--heroku-app) for initial deployment (see "deploy" command help for more information)'
    );
  }

  utils.runCommand('heroku', ['git:remote', '-a', herokuAppId, '-r', HEROKU_INSTANCE], {
    title: `Init heroku remote "${HEROKU_INSTANCE}"`,
    path: deployDir
  });

  if (remoteHasMaster()) {
    gitCommand(['fetch', HEROKU_INSTANCE]);

    gitCommand(['checkout', `${HEROKU_INSTANCE}/master`, '-b', HEROKU_INSTANCE]);
  }
}

function afterDeploy(deployParams) {
  const {target, processManager, appName, deployDir} = deployParams;

  switch (target) {
    case TARGET_LOCAL:
      //install packages there
      let installCommandInfo = packagesHelper.getInstallPackagesCommand();
      utils.runCommand(installCommandInfo.command, installCommandInfo.params, {
        title: 'Install production dependencies',
        path: deployParams.deployDir
      });

      startLocalApp(processManager, appName);
      break;
    case TARGET_HEROKU:
      utils.runCommand('git', ['checkout', '-b', HEROKU_INSTANCE], {
        path: deployDir,
        ignoreError: true
      });

      utils.runCommand('git', ['add', '.'], {
        title: 'Add files to git',
        path: deployDir
      });

      utils.runCommand(
        'git',
        ['commit', '-m', `"Deployment at ${dateFns.format(new Date(), 'YYYY-MM-DDTHH:mm:ss')}"`],
        {
          title: 'Commit files to git',
          userError: 'It seems that you have deployed the current code already. Make some changes and try again.',
          path: deployDir
        }
      );

      utils.runCommand('git', ['push', HEROKU_INSTANCE, `${HEROKU_INSTANCE}:master`], {
        title: 'Deploying to Heroku...',
        showOutput: true,
        path: deployDir
      });
      break;
    case TARGET_NOW:
      utils.runCommand('now', ['-y', '--public'], {
        path: deployDir,
        title: 'Deploy to Now',
        showOutput: true
      });
      let nowConfig = getNowConfig(deployDir);
      if (nowConfig.alias) {
        utils.runCommand('now', ['alias'], {
          path: deployDir,
          title: 'Add alias',
          showOutput: true
        });
      }
      break;
  }
}

function ensureBuild(skipClientBuild) {
  //return Promise.resolve(null);

  installModule.installAll();

  return buildModule.build(skipClientBuild ? 'server' : 'full');
}

function detectProcessManager() {
  let processManager = utils.findGlobalCommandByPrecedence(['pm2', 'forever']);

  if (!processManager) {
    utils.logAndExit(`Install globally one of supported process managers: forever or pm2.`);
  }

  return processManager;
}

function stopLocalApp(processManager, appName) {
  let params = [];

  if (processManager === 'forever') {
    params = ['stop', appName];
  }

  if (processManager === 'pm2') {
    params = ['delete', appName];
  }

  utils.runCommand(processManager, params, {
    path: getLocalDeploymentDir(),
    ignoreError: true,
    showOutput: false
  });
}

function startLocalApp(processManager, appName) {
  let params = [];

  if (processManager === 'forever') {
    params = ['start', '--id', appName, 'index.js'];
  }

  if (processManager === 'pm2') {
    params = ['start', 'index.js', '--name', appName];
  }

  utils.runCommand(processManager, params, {
    title: 'Start process',
    path: getLocalDeploymentDir()
  });

  utils.logAndExit(`Process has been started. By default it is available on ${chalk.cyan('http://localhost:5000')}.`);
}

function getLocalDeploymentDir() {
  return pathHelper.projectRelative(config.paths.deploy.root, TARGET_LOCAL);
}

function getNowConfig(deployDir) {
  let nowConfigPath = pathHelper.path.join(deployDir, 'now.json');
  if (!fs.existsSync(nowConfigPath)) utils.logAndExit('Create now.json configuration file in deployment folder.');

  let nowConfig = fs.readJsonSync(nowConfigPath);

  return nowConfig;
}
