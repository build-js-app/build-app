var _ = require('lodash');
var fs = require('fs-extra');
var path = require('path');

var config = module.exports = {
    paths: {
        package: './build',
        serverBundle: './server/build/server.js',
        serverEntry: './server/build/src/startServer.js',
        clientBuild: './client/build'
    },
    server: {
        sourceLang: 'ts', //ts / js_next / js_es6 / js
        removeMapFiles: true,
        minify: true,
        bundleNodeModules: true
    }
};

try {
    var localConfig = fs.readJsonSync(path.join(process.env.APP_DIR, './app-build.json'));

    _.merge(config, localConfig);

    console.log('Using config from app-build.json file.');
} catch (err) {}