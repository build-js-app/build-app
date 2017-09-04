(process as any).noDeprecation = true;

import * as fs from 'fs-extra';
import * as webpack from 'webpack';
import * as chalk from 'chalk';
import * as klawSync from 'klaw-sync';
import * as del from 'del';

import webpackConfigLoader from '../config/webpackConfigLoader';
import webpackHelper from '../helpers/webpackHelper';
import pathHelper from './../helpers/pathHelper';
import utils from './../helpers/utils';
import envHelper from '../helpers/envHelper';
import config from '../config/config';

export default {
  command: 'build',
  describe: 'Build project for production',
  handler: commandHandler,
  builder: commandBuilder,
  build
};

type BUILD_TARGET = 'server' | 'client' | 'full';

function commandBuilder(yargs) {
  return yargs
    .option('server', {
      alias: 's',
      boolean: true,
      description: 'build server'
    })
    .option('client', {
      alias: 'c',
      boolean: true,
      description: 'build client'
    });
}

async function commandHandler(argv) {
  envHelper.checkFolderStructure();
  envHelper.checkDependenciesInstalled();

  let target: BUILD_TARGET = 'full';

  if (argv.server) target = 'server';
  if (argv.client) target = 'client';
  if (argv.server && argv.client) target = 'full';

  await build(target);
}

async function build(target: BUILD_TARGET = 'full') {
  let startTime = new Date();

  utils.log('Build project in ' + chalk.cyan(pathHelper.getAppPath()) + '.');

  let buildDir = config.paths.build.root;
  utils.ensureEmptyDir(buildDir);

  if (target !== 'client') {
    await buildServer();
  } else {
    utils.log(`Build server... ${chalk.yellow('skipped')}.`);
  }
  copyServerOutput();

  if (target !== 'server') {
    await buildClient();
  } else {
    utils.log(`Build client... ${chalk.yellow('skipped')}.`);
  }
  copyClientOutput();

  utils.log('Post build:');

  utils.logOperation('Copying data folder', () => {
    copyDataFolder();

    //index file to run app with production env params
    utils.copyToPackage(pathHelper.moduleRelative('./assets/build/serverIndex.js'), './index.js');
  });

  let endTime = new Date();
  let compilationTime = utils.getFormattedTimeInterval(startTime, endTime);

  utils.log('Build package was created!', 'green');
  utils.log('Compilation time: ' + chalk.cyan(compilationTime) + '.');

  if (config.postBuild.archive) {
    let archive = utils.archiveFolder(pathHelper.buildRelative('./'), pathHelper.buildRelative('./build.zip'));

    return utils.logOperation('Archive build package', archive);
  }
}

async function buildServer() {
  utils.log('Server build:', 'green');

  runNpmScriptIfExists('pre-build', 'server');

  if (envHelper.isTsServerLang()) {
    envHelper.checkTypeScript();

    utils.runCommand('tsc', [], {
      path: pathHelper.serverRelative('./'),
      title: 'Compiling TypeScript',
      showOutput: true
    });
  }

  await utils.logOperation('Transpiling JavaScript', buildServerJs);

  runNpmScriptIfExists('post-build', 'server');
}

function copyServerOutput() {
  utils.logOperation('Copying assets', () => {
    utils.copyToPackage(pathHelper.serverRelative(config.paths.server.bundle), './server/server.js');

    let serverPackagePath = pathHelper.serverRelative('./package.json');
    let serverPackageJson = utils.readJsonFile(serverPackagePath);

    let rootPackagePath = pathHelper.projectRelative('./package.json');
    let rootPackage = utils.readJsonFile(rootPackagePath);

    let buildPackageJson = {
      name: rootPackage.name,
      version: rootPackage.version,
      scripts: {
        start: 'node index.js'
      },
      dependencies: serverPackageJson.dependencies
    };

    fs.outputJsonSync(pathHelper.buildRelative('./package.json'), buildPackageJson);
  });
}

function buildServerJs() {
  return new Promise((resolve, reject) => {
    let webpackConfig = null;

    if (envHelper.isTsServerLang()) {
      webpackConfig = webpackConfigLoader.loadWebpackConfig('ts_prod');
    } else {
      webpackConfig = webpackConfigLoader.loadWebpackConfig('js_prod');
    }

    webpack(webpackConfig).run((err, stats) => {
      if (err) return reject(err);

      webpackHelper.handleErrors(err, stats, true);

      resolve();
    });
  });
}

function buildClient() {
  utils.log('Client build:', 'green');

  runNpmScriptIfExists('pre-build', 'client');

  utils.runCommand('npm', ['run', 'build'], {
    title: 'Build client',
    path: pathHelper.clientRelative('./')
  });

  runNpmScriptIfExists('post-build', 'client');

  return Promise.resolve();
}

function copyClientOutput() {
  utils.logOperation('Copying assets', () => {
    utils.copyToPackage(pathHelper.clientRelative(config.paths.client.build), './client');

    if (config.server.build.removeMapFiles) {
      let clientPath = pathHelper.buildRelative(config.paths.client.root);
      let files = klawSync(clientPath);
      for (let file of files) {
        if (file.path.endsWith('.map')) {
          fs.removeSync(file.path);
        }
      }
    }
  });
}

function copyDataFolder() {
  utils.copyToPackage(pathHelper.serverRelative(config.paths.server.data), './data/');

  utils.ensureEmptyDir(pathHelper.buildRelative('./data/config'));
}

function runNpmScriptIfExists(scriptName: string, target: 'server' | 'client') {
  if (envHelper.checkNpmScriptExists(target, scriptName)) {
    utils.runCommand('npm', ['run', scriptName], {
      title: `Running ${scriptName} npm script`,
      path: target === 'server' ? pathHelper.serverRelative('./') : pathHelper.clientRelative('./')
    });
  }
}
