import * as fs from 'fs-extra';
import * as path from 'path';
import config from '../config/config';

let appDir = process.env.APP_DIR;
if (!appDir) throw new Error('ENV param APP_DIR is not initialized');

let rootDir = getRoot();
let packageDir = appRelative(config.paths.buildPackage);

export default {
    init: init,
    rootRelative: rootRelative,
    appRelative: appRelative,
    packageRelative: packageRelative,
    getRoot: getRoot,
    getAppPath: () => appDir
};

function init(appDirPath) {
    appDir = appDirPath;
}

function rootRelative(relativePath) {
    return path.resolve(rootDir, relativePath);
}

function appRelative(relativePath) {
    return path.resolve(appDir, relativePath);
}

function packageRelative(relativePath) {
    return path.resolve(packageDir, relativePath);
}

function getRoot() {
    return fs.realpathSync(path.resolve(__dirname, '../..'));
}

