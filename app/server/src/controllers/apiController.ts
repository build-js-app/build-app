import helper from './_controllerHelper';
import dataRepository from '../repositories/dataRepository';
import importRepository from '../repositories/importRepository';
import * as multiparty from 'multiparty';

export default {
    getItems
};

async function getItems(req, res) {
    try {
        let result = await dataRepository.getItems();

        return helper.sendData(result, res);

    } catch (err) {
        return helper.sendFailureMessage(err, res);
    }
}