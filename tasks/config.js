module.exports = {
    paths: {
        package: './build',
        serverBundle: './server/build/server.js',
        serverEntry: './server/build/src/startServer.js',
        clientBuild: './client/build'
    },
    server: {
        sourceLang: 'ts', //ts / js_next / js_es6 / js
        removeMapFiles: true,
        minify: true,
        bundleNodeModules: false
    }
};