import helper from './_controllerHelper';
import pathHelper from '../helpers/pathHelper';
import config from '../config';

export default {
    home,
    info
};

async function home(req, res) {
    try {
        return res.sendFile(pathHelper.getClientRelative('index.html'));
    } catch (err) {
        helper.sendFailureMessage(err, res);
    }
}

async function info(req, res) {
    try {
        return helper.sendData({app: config.appID}, res)
    } catch (err) {
        helper.sendFailureMessage(err, res);
    }
}