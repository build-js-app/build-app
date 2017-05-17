import * as _ from 'lodash';
import * as fs from 'fs-extra';
import * as path from 'path';

let config = {
    paths: {
        build: {
            root: './build'
        },
        deploy: {
            root: './deploy'
        },
        archive: {
            root: './archive'
        },
        server: {
            root: './server',
            src: './src',
            build: './build',
            //by default expects index.ts or index.js in src folder
            entry: '',
            bundle: './build/server.js',
            data: './data',
            local: './local'
        },
        client: {
            root: './client',
            build: './build'
        },
    },
    server: {
        //sourceLang: 'ts', //ts or js
        build: {
            nodeVersion: '6', //0, 4, 5, 6, 7
            removeMapFiles: true,
            //make sure source is ES5, that should include external npm packages too
            minify: false,
            bundleNodeModules: false
        },
        dev: {
            nodeVersion: '6',
            debugPort: 9999
        }
    },
    postBuild: {
        run: false,
        archive: false
    }
};

try {
    let localConfig = fs.readJsonSync(path.join(process.env.APP_DIR, './app-build.json'));

    _.merge(config, localConfig);

    console.log('Using config from app-build.json file.');
} catch (err) {
}

export default config;