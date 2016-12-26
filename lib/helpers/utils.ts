import * as chalk from 'chalk';
import * as fs from 'fs-extra';
import * as config from './../config';
import * as moment from 'moment';
import pathHelper from './pathHelper';

import * as crossSpawn from 'cross-spawn';
let spawn = crossSpawn.sync;

export default {
    log: log,
    copy: copy,
    runCommand: runCommand,
    ensureEmptyDir: ensureEmptyDir,
    getFormattedTimeInterval: getFormattedTimeInterval
};

function log(message = '', color = null) {
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

