import * as jsonfile from 'jsonfile';
import pathHelper from '../helpers/pathHelper';
import * as fs from 'fs';
import config from '../config';

export default {
    readData,
    saveData
}

let dbPath = config.dbPath;
if (!dbPath) {
    dbPath = pathHelper.getDataRelative('db.json');
}

let jsonData = readDataSync();

function readDataSync() {
    try {
        let stat = fs.statSync(dbPath);
    } catch (err) {
        if (err.code === 'ENOENT') {

            console.log(`Cannot open db at ${dbPath}. Generating empty one.`);

            jsonfile.writeFileSync(dbPath, getDefaultData())
        } else {
            throw err;
        }
    }

    return jsonfile.readFileSync(dbPath);
}

function readData(){
    return jsonData;
}

function saveData(data) {
    return new Promise((resolve, reject) => {
        jsonfile.writeFile(dbPath, data, function (err) {
            if (err) return reject(err);

            jsonData = data;

            return resolve(null);
        })
    });
}

function getDefaultData() {
    return {
        tags: [],
        bookmarks: []
    }
}