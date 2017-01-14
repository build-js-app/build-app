import * as _ from 'lodash';
import * as fs from 'fs-extra';
import * as path from 'path';

let config = {
    paths: {
        buildPackage: './build',
        serverBundle: './server/build/server.js',
        serverEntry: './server/build/src/index.js',
        clientBuild: './client/build'
    },
    server: {
        sourceLang: 'ts', //ts / js_next / js_es6 / js
        removeMapFiles: true,
        minify: true,
        bundleNodeModules: true,
        run: false
    }
};

try {
    let localConfig = fs.readJsonSync(path.join(process.env.APP_DIR, './app-build.json'));

    _.merge(config, localConfig);

    console.log('Using config from app-build.json file.');
} catch (err) {}

export default config;