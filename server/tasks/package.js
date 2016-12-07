const rollup = require('rollup').rollup;
const commonjs = require('rollup-plugin-commonjs');
const nodeResolve = require('rollup-plugin-node-resolve');
const json = require('rollup-plugin-json');
const fs = require('fs');

rollup({
    entry: './build/src/app.js',
    dest: 'package.js',
    plugins: [
        json({}),
        nodeResolve({
            jsnext: true,
            main: true
        }),

        commonjs({
            // non-CommonJS modules will be ignored, but you can also
            // specifically include/exclude files
            //include: 'node_modules/**',  // Default: undefined
            //exclude: [ 'node_modules/foo/**', 'node_modules/bar/**' ],  // Default: undefined

            // search for files other than .js files (must already
            // be transpiled by a previous plugin!)
            extensions: ['.js'],  // Default: [ '.js' ]

            // if true then uses of `global` won't be dealt with by this plugin
            ignoreGlobal: false,  // Default: false

            // if false then skip sourceMap generation for CommonJS modules
            sourceMap: false  // Default: true

            // explicitly specify unresolvable named exports
            // (see below for more details)
            //namedExports: { './module.js': ['foo', 'bar' ] }  // Default: undefined
        })
    ]
})
.then((bundle) => {
    var bundle = bundle.generate({
        // output format - 'amd', 'cjs', 'es', 'iife', 'umd'
        format: 'cjs'
    });

    fs.writeFileSync('./build/app.js', bundle.code);
})
.then(() => {
    console.log("Server code was successfully packaged!")
});