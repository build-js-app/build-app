var chalk = require('chalk');
var fs = require('fs-extra');
var path = require('path');
var config = require('./config');

var rootDirectory = getRoot();
var appDirectory = 'd:\\Projects\\build-app\\app';//getRoot();
var packageDirectory = appRelative(config.paths.package);

module.exports = {
    log: log,
    copy: copy,
    ensureEmptyDir: ensureEmptyDir,
    path: {
        rootRelative: rootRelative,
        appRelative: appRelative,
        packageRelative: packageRelative,
        getRoot: getRoot
    }
};

function log(message, color) {
    if (color) {
        console.log(chalk[color](message));
    } else {
        console.log(message);
    }
}

function copy(from, to) {
    if (from.startsWith('.')) {
        from = appRelative(from);
    }

    if (to.startsWith('.')) {
        to = packageRelative(to);
    }

    fs.copySync(from, to);
}

function rootRelative(relativePath) {
    return path.resolve(rootDirectory, relativePath);
}

function appRelative(relativePath) {
    return path.resolve(appDirectory, relativePath);
}

function packageRelative(relativePath) {
    return path.resolve(packageDirectory, relativePath);
}

function getRoot() {
    return fs.realpathSync(process.cwd());
}

function ensureEmptyDir(path) {
    if (path.startsWith('.')) {
        path = appRelative(path);
    }

    fs.emptyDirSync(path);
}

