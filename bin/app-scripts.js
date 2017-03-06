#!/usr/bin/env node
var spawn = require('cross-spawn');
var script = process.argv[2];
var args = process.argv.slice(3);

let scripts = ['build', 'dev', 'init'];

if (!script) {
    console.log('Please, specify valid script name. Available options are: ' + scripts.join(', ') + '.');
    return;
}

if (scripts.indexOf(script) !== -1) {
    var result = spawn.sync(
        'node',
        [require.resolve('../dist/scripts/' + script)].concat(args),
        {stdio: 'inherit'}
    );
    process.exit(result.status);
} else {
    console.log('Unknown script "' + script + '".');
    console.log('Perhaps you need to update app-scripts?');
}