import * as chalk from 'chalk';
import * as fs from 'fs-extra';
import * as config from './../config';
import * as moment from 'moment';
import pathHelper from './pathHelper';

import * as crossSpawn from 'cross-spawn';
let spawn = crossSpawn.sync;

export default {
    log,
    logOperation,
    logOperationAsync,
    copy,
    runCommand,
    ensureEmptyDir,
    getFormattedTimeInterval
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
    let displayProgress = !!options.title;
    if (displayProgress) {
        process.stdout.write(`${options.title}... `);
    }

    let start = new Date();

    let result = spawn(cmd, args, {
        stdio: 'inherit',
        cwd: options.path
    });

    if (result.status !== 0) {
        if (displayProgress) {
            let message = 'operation failed.';
            log(message, 'red');
        }

        if (!options.ignoreError) {
            process.exit(1);
        }
    } else {
        if (displayProgress) {
            let end = new Date();
            logDone(start, end);
        }
    }

    return result;
}

function logOperation(title: string, operation: Function) {
    process.stdout.write(`${title}... `);

    let start = new Date();

    try {
        operation();

        let end = new Date();
        logDone(start, end);
    } catch (err) {
        let message = 'operation failed.';
        log(message, 'red');
        process.exit(1);
    }
}

function logOperationAsync(title: string, operation): any {
    process.stdout.write(`${title}... `);
    let start = new Date();

    return operation
        .then((result) => {
            let end = new Date();
            logDone(start, end);

            return result;
        })
        .catch((err) => {
            let message = 'operation failed.';
            log(message, 'red');
            console.log(err);
            process.exit(1);
        });
}

function logDone(start, end) {
    let runTime = getFormattedTimeInterval(start, end);
    if (runTime === '00:00:00') {
        log('done.', 'green');
    } else {
        log(`${chalk.green('done')} in ${chalk.cyan(runTime)}.`);
    }
}