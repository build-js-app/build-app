import * as _ from 'lodash';
import * as fs from 'fs-extra';
import * as path from 'path';

let config = {
    paths: {
        buildPackage: './build',
        server: {
            root: './server',
            src: './src',
            build: './build',
            entry: './build/src/index.js',
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
        build: {
            sourceLang: 'ts', //ts / js_next / js_es6 / js
            removeMapFiles: true,
            transpileJs: false,
            //make sure source is ES5, that should include external npm packages too
            minify: false,
            bundleNodeModules: false,
            run: false
        },
        dev: {
            debugPort: 9999
        }
    }
};

try {
    let localConfig = fs.readJsonSync(path.join(process.env.APP_DIR, './app-build.json'));

    _.merge(config, localConfig);

    console.log('Using config from app-build.json file.');
} catch (err) {
}

export default config;