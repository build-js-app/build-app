process.env.NODE_ENV = 'production';

try {
    require('./server/server.js');
} catch (err) {
    console.log(err);
}