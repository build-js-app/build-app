import utils from './utils';

export default {
    checkTypeScript
}

function checkTypeScript() {
    if (!utils.commandExists('tsc')) {
        utils.log('TypeScript is not installed globally.', 'red');
        utils.log(`Use 'npm install -g typescript'`);
        process.exit(0);
    }
}