var chalk = require('chalk');
var fs = require('fs-extra');
var config = require('./../config');
var moment = require('moment');
var pathHelper = require('./pathHelper');
var spawn = require('cross-spawn').sync;

module.exports = {
    log: log,
    copy: copy,
    runCommand: runCommand,
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

function runCommand(cmd, args, options) {
    var result = spawn(cmd, args, {
        stdio: 'inherit',
        cwd: options.path
    });

    if (result.status !== 0) {
        if (options.errorMessage) {
            log(options.errorMessage, 'red');
        }
        if (!options.ignoreError) {
            process.exit(1);
        }
    } else {
        if (options.successMessage) {
            log(options.successMessage, 'green');
        }
    }

    return result;
}

