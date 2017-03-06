import * as fs from 'fs-extra';

export default {
    initEnv: initEnvVars
}

function initEnvVars() {
    if (!process.env.APP_DIR) {
        process.env.APP_DIR = fs.realpathSync(process.cwd());
    }
    process.env.NODE_ENV = 'production';
}