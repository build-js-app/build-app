import * as winston from 'winston';
import config from './config';

let errorLogger = null;

export default {
    error: logError,
};

//TODO
function logError(err) {
    console.log(err);
}