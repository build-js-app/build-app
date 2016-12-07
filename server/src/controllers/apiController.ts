import helper from './_controllerHelper';
import dataRepository from '../repositories/dataRepository';
import importRepository from '../repositories/importRepository';
import * as multiparty from 'multiparty';

export default {
    getBookmarks,
    deleteBookmark,
    saveBookmark,
    deleteBookmarks,
    statistic,
    importBrowserBookmarks,
    addTagsForMultipleBookmarks,
    restoreBookmark
};

async function getBookmarks(req, res) {
    try {
        let data = req.query;

        let searchQuery = {
            activePage: parseInt(data.activePage),
            sortBy: data.sortBy,
            sortAsc: data.sortAsc === 'true',
            searchStr: data.searchStr,
            searchMode: data.searchMode,
            searchTags: JSON.parse(data.searchTags),
            pageSize: parseInt(data.pageSize)
        };

        let result = await dataRepository.getBookmarks(searchQuery);

        return helper.sendData(result, res);

    } catch (err) {
        return helper.sendFailureMessage(err, res);
    }
}

async function deleteBookmark(req, res) {
    try {
        let bookmarkId = parseInt(req.params.id);

        await dataRepository.deleteBookmark(bookmarkId);

        return helper.sendData({}, res);
    } catch (err) {
        return helper.sendFailureMessage(err, res);
    }
}

async function saveBookmark(req, res) {
    try {
        let bookmark = req.body.bookmark;

        await dataRepository.saveBookmark(bookmark);

        return helper.sendData({}, res);
    } catch (err) {
        return helper.sendFailureMessage(err, res);
    }
}

async function deleteBookmarks(req, res) {
    try {
        let ids = req.body.ids;

        await dataRepository.deleteMultipleBookmarks(ids);

        return helper.sendData({}, res);
    } catch (err) {
        return helper.sendFailureMessage(err, res);
    }
}

async function statistic(req, res) {
    try {
        let stat = await dataRepository.getStatistic();

        return helper.sendData(stat, res);
    } catch (err) {
        return helper.sendFailureMessage(err, res);
    }
}

async function importBrowserBookmarks(req, res) {
    try {
        let files: any = await parseFiles(req);

        let filePath = files.bookmarks[0].path;

        let importResults = await importRepository.importBrowserBookmarks(filePath);

        return helper.sendData(importResults, res);
    } catch (err) {
        return helper.sendFailureMessage(err, res);
    }
}

function parseFiles(req) {
    return new Promise((resolve, reject) => {
        var form = new multiparty.Form();

        form.parse(req, function (err, fields, files) {
            if (err) return reject(err);

            return resolve(files);
        });
    });
}

async function addTagsForMultipleBookmarks(req, res) {
    try {
        let ids = req.body.ids;
        let selectedTags = req.body.selectedTags;

        await dataRepository.addTagsForMultipleBookmarks(ids, selectedTags);

        return helper.sendData({}, res);
    } catch (err) {
        return helper.sendFailureMessage(err, res);
    }
}

async function restoreBookmark(req, res) {
    try {
        let bookmarkId = req.body.id;

        await dataRepository.restoreBookmark(bookmarkId);

        return helper.sendData({}, res);
    } catch (err) {
        return helper.sendFailureMessage(err, res);
    }
}