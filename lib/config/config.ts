import * as _ from 'lodash';
import * as fs from 'fs-extra';
import * as path from 'path';

import utils from '../helpers/utils';

export const packageManagers = ['pnpm', 'yarn', 'npm'];

let config = {
  paths: {
    build: {
      root: './build'
    },
    deploy: {
      root: './deploy'
    },
    archive: {
      root: './archive'
    },
    server: {
      root: './server',
      src: './src',
      build: './build',
      //by default expects index.ts or index.js in src folder
      entry: '',
      bundle: './build/server.js',
      data: './data',
      local: './local'
    },
    client: {
      root: './client',
      build: './build'
    }
  },
  packageManager: '',
  server: {
    //sourceLang: 'ts', //ts or js
    build: {
      nodeVersion: '6', //0, 4, 5, 6, 7
      removeMapFiles: true,
      //make sure source is ES5, that should include external npm packages too
      minify: false,
      bundleNodeModules: false
    },
    dev: {
      nodeVersion: '6',
      debugPort: 9999
    }
  },
  postBuild: {
    run: false,
    archive: false
  }
};

function tryToReadLocalConfigFile(configObj, relativeConfigPath) {
  try {
    let configPath = path.join(process.env.APP_DIR, relativeConfigPath);
    if (!fs.existsSync(configPath)) return false;
    let localConfig = fs.readJsonSync(configPath);

    //TODO generic
    let packageManager = localConfig.packageManager;
    if (packageManager) {
      utils.assertValueIsInTheList(
        packageManager,
        packageManagers,
        `Local napp config has incorrect packageManager value: '${packageManager}'`
      );
      config.packageManager = packageManager;
      let logConfigUse = false;
      if (logConfigUse) utils.log(`Using config from '${relativeConfigPath}' file.`);
    }
  } catch (err) {
    return false;
  }
}

try {
  let configFiles = ['build-app.json', 'napp.json'];
  for (let configPath of configFiles) {
    let wasUsed = tryToReadLocalConfigFile(config, configPath);
    if (wasUsed) break;
  }
} catch (err) {}

export default config;
