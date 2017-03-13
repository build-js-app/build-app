import * as chalk from 'chalk';
import * as fs from 'fs-extra';
import * as config from '../config/config';
import * as klawSync from 'klaw-sync';
import * as moment from 'moment';
import * as rl from 'readline';
import * as Promise from 'bluebird';
import * as del from 'del';
import * as archiver from 'archiver';
import {sync as commandExists} from 'command-exists';

import pathHelper from './pathHelper';

import * as crossSpawn from 'cross-spawn';
let spawn = crossSpawn.sync;

export default {
    log,
    logOperation,
    logOperationAsync,
    clearConsole,
    prompt,
    copyToPackage,
    commandExists,
    runCommand,
    ensureEmptyDir,
    isEmptyDir,
    removeDir,
    getFormattedTimeInterval,
    archiveFolder
};

type Utils_CL_Color = 'red' | 'green';

function log(message = '', color: Utils_CL_Color = null) {
    if (color) {
        console.log(chalk[color](message));
    } else {
        console.log(message);
    }
}

function clearConsole() {
    process.stdout.write(process.platform === 'win32' ? '\x1Bc' : '\x1B[2J\x1B[3J\x1B[H');
}

function prompt(question, isYesDefault) {
    if (typeof isYesDefault !== 'boolean') {
        throw new Error('Provide explicit boolean isYesDefault as second argument.');
    }
    return new Promise(resolve => {
        let rlInterface = rl.createInterface({
            input: process.stdin,
            output: process.stdout,
        });

        let hint = isYesDefault === true ? '[Y/n]' : '[y/N]';
        let message = question + ' ' + hint + '\n';

        rlInterface.question(message, function(answer) {
            rlInterface.close();

            let useDefault = answer.trim().length === 0;
            if (useDefault) {
                return resolve(isYesDefault);
            }

            let isYes = answer.match(/^(yes|y)$/i);
            return resolve(isYes);
        });
    });
}

function copyToPackage(from, to) {
    if (to.startsWith('.')) {
        to = pathHelper.packageRelative(to);
    }

    fs.copySync(from, to);
}

function ensureEmptyDir(path) {
    del.sync(path + '/*.*', {
        force: true
    });

    fs.emptyDirSync(path);
}

function isEmptyDir(path) {
    let paths = klawSync(path)
    return paths.length === 0;
}

function removeDir(path) {
    return del.sync(path);
}

function getFormattedTimeInterval(start, end) {
    let diff = moment.utc(moment(end).diff(moment(start)));
    if (diff.minutes() > 0) {
        return diff.format('HH:mm:ss');
    } else {
        return `${diff.format('ss.SS')} seconds`
    }
}

interface Utils_RunCommandOptions {
    title?: string,
    path: string,
    ignoreError?: boolean,
    hideOutput?: boolean
}

function commandExists(command) {
    return commandExists(command);
}

function runCommand(cmd, args, options: Utils_RunCommandOptions) {
    let displayProgress = !!options.title;
    if (displayProgress) {
        process.stdout.write(`${options.title}... `);
    }

    let start = new Date();

    let env = process.env;
    env.NODE_ENV = '';

    let result = spawn(cmd, args, {
        stdio: options.hideOutput ? ['ignore', 'ignore', process.stderr]: 'inherit',
        cwd: options.path,
        env: env
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

function archiveFolder(source, destination) {
    return new Promise((resolve, reject) => {
        let output = fs.createWriteStream(destination);
        let archive = archiver('zip');

        output.on('close', function() {
            return resolve(archive);
        });

        archive.on('error', function(err) {
            return reject(err);
        });

        archive.pipe(output);

        archive.directory(source, '');

        archive.finalize();
    });
}