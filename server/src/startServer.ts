process.on('uncaughtException', function (err) {
    let stack = err.stack;
    console.log(`Uncaught exception. ${err}`);
});

import server from './server';
import config from './config';

server.start(config.port)
    .then((port) => {
        console.log(`Server is listening on port ${port}!`);
    });