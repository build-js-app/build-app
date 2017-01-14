#!/usr/bin/env node
var spawn = require('cross-spawn');
var script = process.argv[2];
var args = process.argv.slice(3);

if (!script) {
    script = 'build';
}

switch (script) {
    case 'build':
    case 'test':
        var result = spawn.sync(
            'node',
            [require.resolve('../dist/scripts/' + script)].concat(args),
            {stdio: 'inherit'}
        );
        process.exit(result.status);
        break;
    default:
        console.log('Unknown script "' + script + '".');
        console.log('Perhaps you need to update app-scripts?');
        break;
}