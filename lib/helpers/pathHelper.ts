import * as fs from 'fs-extra';
import * as path from 'path';
import config from '../config/config';

let projectDir = process.env.APP_DIR;
if (!projectDir) throw new Error('ENV param APP_DIR is not initialized');

let moduleRootDir = getModuleRoot();

export default {
    init,
    path,
    moduleRelative,
    projectRelative,
    serverRelative,
    clientRelative,
    packageRelative,
    getAppPath: () => projectDir,
    //used in init command
    setAppPath: (newPath) => {
      projectDir = newPath;
    }
};

function init(appDirPath) {
    projectDir = appDirPath;
}

function moduleRelative(relativePath) {
    return path.resolve(moduleRootDir, relativePath);
}

function projectRelative(relativePath) {
    return path.resolve(projectDir, relativePath);
}

function serverRelative(relativePath) {
    return path.resolve(projectDir, config.paths.server.root, relativePath);
}

function clientRelative(relativePath) {
    return path.resolve(projectDir, config.paths.client.root, relativePath);
}

function packageRelative(relativePath) {
    let packageDir = projectRelative(config.paths.buildPackage);
    return path.resolve(packageDir, relativePath);
}

function getModuleRoot() {
    return fs.realpathSync(path.resolve(__dirname, '../..'));
}

