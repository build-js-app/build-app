import homeController from '../controllers/homeController';
import bookmarkController from '../controllers/bookmarkController';
import tagController from '../controllers/tagController';

export default {
    init: initRoutes
};

function initRoutes(app) {
    initApiRoutes(app);

    app.get('/info', homeController.info);

    //all other routes are rendered as home (for client side routing)
    app.get('*', homeController.home);
}

function initApiRoutes(app) {
    app.get('/api/bookmarks', bookmarkController.getBookmarks);
    app.delete('/api/bookmark/:id', bookmarkController.deleteBookmark);
    app.post('/api/saveBookmark', bookmarkController.saveBookmark);
    app.put('/api/deleteMultipleBookmarks', bookmarkController.deleteBookmarks);
    app.get('/api/statistic', bookmarkController.statistic);
    app.put('/api/addTagsForMultipleBookmarks', bookmarkController.addTagsForMultipleBookmarks);
    app.post('/api/restoreBookmark', bookmarkController.restoreBookmark);

    app.get('/api/tags', tagController.getTags);
    app.delete('/api/tag/:id', tagController.deleteTag);
    app.post('/api/saveTag', tagController.saveTag);

    app.post('/api/import/browserBookmarks', bookmarkController.importBrowserBookmarks);
}

