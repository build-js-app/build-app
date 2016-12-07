import * as _ from 'lodash';
import * as jsonfile from 'jsonfile';
import pathHelper from './helpers/pathHelper';

let config = {
    port: 4088,
    isDevLocal: process.env['NODE_ENV'] === 'development',
    appID: 'Bookmarks Archive',
    dbPath: ''
};

function tryReadConfigFile(fileName) {
    let filePath = pathHelper.getDataRelative('config', fileName);

    try {
        return jsonfile.readFileSync(filePath);
    } catch (err) {
        console.log(`Cannot load settings file ${filePath}`);
        return {};
    }
}

let defaultFile = tryReadConfigFile('settings.json');
_.merge(config, defaultFile);

if (config.isDevLocal) {
    let localFile = tryReadConfigFile('local.json');
    _.merge(config, localFile);
}

console.log('Config values:');
console.log(config);

export default config;