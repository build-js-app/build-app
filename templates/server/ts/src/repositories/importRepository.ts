import * as parser from 'parse5';
import * as _ from 'lodash';
import * as moment from 'moment';
import storageHelper from './storageHelper';
import * as fs from 'fs';

export default {
    importBrowserBookmarks
};

async function importBrowserBookmarks(filePath) {
    let result = {
        added: 0,
        skipped: 0
    };

    let fileData = fs.readFileSync(filePath, 'utf8');

    let htmlDoc = parser.parse(fileData);

    let htmlBody = findNode(htmlDoc, (node) => {
        return node.tagName === 'body';
    });

    let mainFolder = findNode(htmlBody, (node) => {
        return node.tagName === 'dl';
    });

    let bookmarks = importFolder(mainFolder, [], []);

    let existingData = storageHelper.readData();

    let urlsLookup = {};
    let maxId = 0;
    for (let bookmark of existingData.bookmarks) {
        urlsLookup[bookmark.url] = true;
        if (bookmark.id > maxId) {
            maxId = bookmark.id;
        }
    }

    for (let bookmark of bookmarks) {
        if (urlsLookup[bookmark.url]) {
            result.skipped++;
            continue;
        }

        let newBookmark = {
            id: maxId++,
            title: bookmark.title,
            url: bookmark.url,
            isDeleted: false,
            tags: [],
            creationDate: bookmark.date,
            originalPath: bookmark.originalPath
        };

        existingData.bookmarks.push(newBookmark);

        result.added++;
    }

    await storageHelper.saveData(existingData);

    return Promise.resolve(result);
}

function importFolder(folderNode, pathFolders, bookmarks) {
    let childNodes = folderNode ? folderNode.childNodes : [];

    let length = childNodes.length;
    console.log(`Folder length: ${length}`);

    let processed = 0;
    let currentPath = pathFolders.length ? pathFolders.join('/') : '';

    while (processed < length) {
        let nodeNameString = childNodes[processed].nodeName.toLowerCase();

        if (nodeNameString === 'p' || nodeNameString === 'dd') {
            processed++;
            continue;
        }

        let nextNode = childNodes[processed].childNodes[0];

        if (nextNode.nodeName.toLowerCase() === 'a') {
            let name = getTextContent(nextNode);
            let href = getAttr('href', nextNode);
            let dateUnix = getAttr('add_date', nextNode);
            let dateFull = moment.unix(dateUnix).format('MM/DD/YYYY');

            //console.log(`Bookmark: Folder: ${folderName} Date: ${dateFull} Name: ${name} Url: ${href}`);
            let bookmark = {
                title: name,
                url: href,
                date: dateFull,
                originalPath: currentPath.toLocaleLowerCase()
            };

            bookmarks.push(bookmark);

            processed++;
        }

        if (nextNode.nodeName.toLowerCase() === 'h3') {
            let name = getTextContent(nextNode);
            let dateUnix = getAttr('add_date', nextNode);
            let dateFull = moment.unix(dateUnix).toDate();

            console.log(`Folder: Date: ${dateFull} Name: ${name}`);

            let subFolder = childNodes[processed].childNodes[2];
            let newPath = pathFolders.slice(0);
            newPath.push(name);
            importFolder(subFolder, newPath, bookmarks);

            processed++;
        }
    }

    return bookmarks;
}

function getAttr(name, node) {
    let attr = _.find(node.attrs, (attr: any) => attr.name.toLowerCase() === name);

    if (!attr) throw new Error(`Cannot find attr: ${name}`);

    return attr.value;
}

function getTextContent(node) {
    return node.childNodes['0'].value;
}

function findNode(node, predicate) {
    if (!node || _.isEmpty(node.childNodes)) return null;

    if (predicate(node)) return node;

    let result = null;

    _.forEach(node.childNodes, (node) => {
        let match = findNode(node, predicate);
        if (match) {
            result = match;
            return false;
        }
    });

    return result;
}