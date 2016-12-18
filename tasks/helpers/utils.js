var chalk = require('chalk');
var fs = require('fs-extra');
var config = require('./../config');
var moment = require('moment');
var pathHelper = require('./pathHelper');

module.exports = {
    log: log,
    copy: copy,
    ensureEmptyDir: ensureEmptyDir,
    getFormattedTimeInterval: getFormattedTimeInterval
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
        from = pathHelper.appRelative(from);
    }

    if (to.startsWith('.')) {
        to = pathHelper.packageRelative(to);
    }

    fs.copySync(from, to);
}

function ensureEmptyDir(path) {
    if (path.startsWith('.')) {
        path = pathHelper.appRelative(path);
    }

    fs.emptyDirSync(path);
}

function getFormattedTimeInterval(start, end) {
    return moment.utc(moment(end).diff(moment(start))).format('HH:mm:ss');
}

