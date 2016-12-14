import * as _ from 'lodash';
import * as jsonfile from 'jsonfile';
import pathHelper from './helpers/pathHelper';

let config = {
    port: 3000,
    isDevLocal: process.env['NODE_ENV'] === 'development',
    appID: 'My App',
    dbPath: ''
};

function tryReadConfigFile(...path) {
    let filePath = pathHelper.getDataRelative(...path);440

    try {
        return jsonfile.readFileSync(filePath);
    } catch (err) {
        console.log(`Cannot load settings file ${filePath}`);
        return {};
    }
}

let defaultFile = tryReadConfigFile('config.json');
_.merge(config, defaultFile);

if (config.isDevLocal) {
    let localFile = tryReadConfigFile('local', 'config.local.json');
    _.merge(config, localFile);
}

console.log('Config values:');
console.log(config);

export default config;