var fs = require('fs-extra');
var path = require('path');
var config = require('../config');

var appDir = process.env.APP_DIR;
var rootDir = getRoot();
var packageDir = appRelative(config.paths.package);

module.exports = {
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
    return fs.realpathSync(process.cwd());
}

