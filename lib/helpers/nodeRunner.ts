import * as nodemon from 'nodemon';
import config from '../config/config';

export default {
    init
}

function init(scriptPath) {
    let path = scriptPath;
    let nodemonInstance = null;

    let stop = () => {
        if (nodemonInstance) {
            nodemonInstance.emit('quit');
        }
        nodemonInstance = null;
    };

    let start = () => {
        if (nodemonInstance) {
            stop();
        }

        nodemonInstance = nodemon({
            script: path,
            ignore: [path],
            watch: [],
            flags: [],
            stdout: false,
            nodeArgs: [`--debug=${config.server.dev.debugPort}`]
        })
            .on('readable', function () {
                this.stdout.on('data', (data) => {
                    if (!nodemonInstance) return;
                    process.stdout.write(data.toString());
                });
                this.stderr.on('data', (data) => {
                    if (!nodemonInstance) return;
                    process.stdout.write(data.toString());
                })
            });

        process.on('uncaughtException', function (err) {
            console.log(err);
            nodemonInstance.emit('quit');
        });
    };

    return {
        start,
        stop
    }
}