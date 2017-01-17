import utils from './utils';

export default {
    handleErrors
}

function handleErrors(err, stats, exit = false) {
    if (err) {
        printErrors('Failed to compile.', [err]);
        if (exit) process.exit(1);
    }

    if (stats.compilation.errors.length) {
        printErrors('Failed to compile.', stats.compilation.errors);
        if (exit) process.exit(1);
    }

    if (process.env.CI && stats.compilation.warnings.length) {
        printErrors('Failed to compile.', stats.compilation.warnings);
        if (exit) process.exit(1);
    }
}

// Print out errors
function printErrors(summary, errors) {
    utils.log(summary, 'red');
    utils.log();
    errors.forEach(err => {
        utils.log(err.message || err);
        utils.log();
    });
}