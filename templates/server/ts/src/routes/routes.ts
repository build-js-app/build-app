import homeController from '../controllers/homeController';
import apiController from '../controllers/apiController';

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
    app.get('/api/items', apiController.getItems);
}

