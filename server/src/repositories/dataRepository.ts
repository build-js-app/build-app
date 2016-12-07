import cacheHelper from './cacheHelper';
import storageHelper from './storageHelper';

export default {
    getItems
}

let jsonData: any = storageHelper.readData();

function saveData() {
    return storageHelper.saveData(jsonData);
}

function getItems() {
    let items = ['Zero', 'One', 'One', 'Two', 'Three', 'Five', 'Eight', 'Thirteen', 'Twenty One'];

    return Promise.resolve(items);
}