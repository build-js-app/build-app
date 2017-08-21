import * as chalk from 'chalk';
import * as fs from 'fs-extra';
import * as _ from 'lodash';
import * as klawSync from 'klaw-sync';
import * as moment from 'moment';
import * as rl from 'readline';
import * as del from 'del';
import * as archiver from 'archiver';
import * as ejs from 'ejs';
import {sync as commandExistsSync} from 'command-exists';

import pathHelper from './pathHelper';

import * as crossSpawn from 'cross-spawn';
let spawn = crossSpawn.sync;

export default {
    log,
    logAndExit,
    logOperation,
    clearConsole,
    prompt,
    copyToPackage,
    commandExists,
    runCommand,
    ensureEmptyDir,
    isEmptyDir,
    dirHasContent,
    clearDir,
    removeDir,
    getFormattedTimeInterval,
    archiveFolder,
    readJsonFile,
    copyTemplate,
    copyTemplateFolder,
    findGlobalCommandByPrecedence
};

type Utils_CL_Color = 'red' | 'green' | 'cyan';

function log(message = '', color: Utils_CL_Color = null) {
    if (color) {
        console.log(chalk[color](message));
    } else {
        console.log(message);
    }
}

function logAndExit(message = '', color: Utils_CL_Color = null) {
    log(message, color);
    process.exit(0);
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
            output: process.stdout
        });

        let hint = isYesDefault === true ? '[Y/n]:' : '[y/N]:';
        let message = question + ' ' + hint;

        rlInterface.question(message, answer => {
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
        to = pathHelper.buildRelative(to);
    }

    fs.copySync(from, to);
}

function ensureEmptyDir(path) {
    del.sync(path + '/*.*', {
        force: true
    });

    fs.emptyDirSync(path);
}

function clearDir(path, exclude) {
    let paths = [];
    paths.push(`${path}/**`);

    for (let excludeDir of exclude) {
        paths.push(`!${excludeDir}`);
    }

    del.sync(paths, {
        force: true
    });
}

//TODO combine isEmptyDir and dirHasContent
function isEmptyDir(path) {
    try {
        let paths = klawSync(path);
        return paths.length === 0;
    } catch (err) {
        if (err.code === 'ENOENT') return true;
        throw err;
    }
}

function dirHasContent(path) {
    try {
        let paths = klawSync(path);
        return paths.length !== 0;
    } catch (err) {
        if (err.code === 'ENOENT') return false;
        throw err;
    }
}

function removeDir(path) {
    return del.sync(path);
}

function getFormattedTimeInterval(start, end) {
    let diff = moment.utc(moment(end).diff(moment(start)));
    if (diff.minutes() > 0) {
        return diff.format('HH:mm:ss');
    } else {
        return `${diff.format('ss.SS')} seconds`;
    }
}

interface Utils_RunCommandOptions {
    title?: string;
    path: string;
    ignoreError?: boolean;
    showOutput?: boolean;
    env?: Object;
}

function commandExists(command) {
    return commandExistsSync(command);
}

function runCommand(cmd, args, options: Utils_RunCommandOptions) {
    let displayProgress = !!options.title;
    let multiLine = options.showOutput;

    if (displayProgress) {
        let message = `${options.title}... `;
        if (multiLine) {
            console.log(message);
        } else {
            process.stdout.write(message);
        }
    }

    let start = new Date();

    let envValues = options.env ? options.env : {};
    let env = _.assign(envValues, process.env);
    env.NODE_ENV = '';

    let stdio: any = ['ignore', 'ignore', 'pipe'];
    if (multiLine) {
        stdio[1] = 'inherit';
        stdio[2] = 'inherit';
    }

    //TODO check options.path exists
    let result = spawn(cmd, args, {
        stdio,
        cwd: options.path,
        env
    });

    if (result.status !== 0) {
        if (displayProgress) {
            let message = multiLine ? 'Operation failed.' : 'operation failed.';
            log(message, 'red');

            if (!multiLine) {
                let error = result.stderr.toString('utf8');
                if (error) {
                    console.log(error);
                }
            }
        }

        if (!options.ignoreError) {
            process.exit(1);
        }
    } else {
        if (displayProgress) {
            let end = new Date();
            logDone(start, end, multiLine);
        }
    }

    return result;
}

async function logOperation(title: string, operation: Function | Promise<any>) {
    process.stdout.write(`${title}... `);

    let start = new Date();

    try {
        if (_.isFunction(operation)) {
            operation();
        } else {
            await operation;
        }

        let end = new Date();
        logDone(start, end);
    } catch (err) {
        let message = 'operation failed.';
        log(message, 'red');
        //TODO log error (log file or console)
        console.log(err);
        process.exit(1);
    }
}

function logDone(start, end, multiLine = false) {
    let runTime = getFormattedTimeInterval(start, end);
    let instant = runTime === '00:00:00';

    let logWithMessage = msg => {
        if (instant) {
            log(`${msg}`, 'green');
        } else {
            log(`${chalk.green(msg)} in ${chalk.cyan(runTime)}.`);
        }
    };

    if (multiLine) {
        logWithMessage('Operation completed');
    } else {
        logWithMessage('done');
    }
}

function archiveFolder(source, destination) {
    return new Promise((resolve, reject) => {
        let output = fs.createWriteStream(destination);
        let archive = archiver('zip');

        output.on('close', () => {
            return resolve(archive);
        });

        archive.on('error', err => {
            return reject(err);
        });

        archive.pipe(output);

        archive.directory(source, '');

        archive.finalize();
    });
}

function readJsonFile(path) {
    return fs.readJsonSync(path);
}

function copyTemplate(from, to, context) {
    fs.copySync(from, to);

    let data = fs.readFileSync(to, 'utf8');
    data = ejs.render(data, context);
    fs.writeFileSync(to, data);
}

function copyTemplateFolder(from, to, context = null) {
    fs.copySync(from, to);

    if (!context) return;

    let paths = klawSync(to);

    for (let filePath of paths) {
        let data = fs.readFileSync(filePath.path, 'utf8');
        data = ejs.render(data, context);
        fs.writeFileSync(filePath.path, data);
    }
}

function findGlobalCommandByPrecedence(commands) {
    for (let command of commands) {
        if (commandExists(command)) return command;
    }

    return null;
}
