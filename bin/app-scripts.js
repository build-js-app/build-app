#!/usr/bin/env node
var spawn = require('cross-spawn');
var args = process.argv.slice(2);


var result = spawn.sync(
    'node',
    [require.resolve('../dist/index.js')].concat(args),
    {stdio: 'inherit'}
);

process.exit(result.status);
