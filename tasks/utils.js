var chalk = require('chalk');
var fs = require('fs-extra');
var path = require('path');
var config = require('./config');

var appDirectory = getRoot();
var packageDirectory = rootRelative(config.paths.package);

module.exports = {
    log: log,
    copy: copy,
    ensureEmptyDir: ensureEmptyDir,
    path: {
        rootRelative: rootRelative,
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
        from = rootRelative(from);
    }

    if (to.startsWith('.')) {
        to = packageRelative(to);
    }

    fs.copySync(from, to);
}

function rootRelative(relativePath) {
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
        path = rootRelative(path);
    }

    fs.emptyDirSync(path);
}

