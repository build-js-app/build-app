import * as path from 'path';
import * as _ from 'lodash';

let profileData = {
    production: {
        root: '../',
        data: './data',
        client: './client'
    },
    development: {
        root: '../../..',
        data: './data',
        client: '../client/build'
    }
};

let rootPath = getRootPath();

export default {
    path,
    getRelative: getRelativePath,
    getDataRelative: getDataRelativePath,
    getClientRelative: getClientRelativePath
};

function getDataRelativePath(...paths) {
    return getRelativePath('data', ...paths)
}

function getClientRelativePath(...paths) {
    return getRelativePath('client', ...paths)
}

function getRelativePath(profileFolder, ...paths: string[]) {
    let folderRelative = profileData[getCurrentProfile()][profileFolder];

    if (!folderRelative) throw Error(`Cannot find relative folder profile '${profileFolder}'`);

    paths.unshift(folderRelative);
    paths.unshift(rootPath);

    return path.join.apply(this, paths);
}

function getRootPath() {
    let rootRelative = profileData[getCurrentProfile()].root;

    if (!rootRelative) throw Error('Cannot find root folder');

    return path.join(__dirname, rootRelative);
}

function getCurrentProfile(){
    let env = process.env['NODE_ENV'];

    return env ? env : 'development';
}