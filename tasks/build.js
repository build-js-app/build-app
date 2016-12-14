/*
    Assume client is build
    Assume server TS is build
    Run webpack in server to produce server bundle
    Create/Clear package folder
    Copy server bundle
    Copy client build to client folder
    Optionally remove map files from client build
    Copy start scripts
    Copy default data
 */

var utils = require('./utils');
var config = require('./config');
var webpack = require('webpack');
var chalk = require('chalk');
var fs = require('fs-extra');

var removeMapFiles = true;

function build() {
    utils.ensureEmptyDir(config.paths.package);

    buildServer(() => {
        buildClient();

        utils.log('Copying assets...');

        copyDataFolder();

        //index file to run app with production env params
        utils.copy('./tasks/templates/index.js', './index.js');

        utils.log('All Done!', 'green');
    });
}

function buildServer(cb) {
    console.log('Creating server bundle...');

    var webpackConfig = require('./webpack/webpack.config.server');
    webpack(webpackConfig).run((err, stats) => {
        if (err) {
            printErrors('Failed to compile.', [err]);
            process.exit(1);
        }

        if (stats.compilation.errors.length) {
            printErrors('Failed to compile.', stats.compilation.errors);
            process.exit(1);
        }

        if (process.env.CI && stats.compilation.warnings.length) {
            printErrors('Failed to compile.', stats.compilation.warnings);
            process.exit(1);
        }

        utils.copy(config.paths.serverBundle, './server/server.js');

        utils.log('Done.', 'green');

        if (cb) {
            cb();
        }
    });
}

// Print out errors
function printErrors(summary, errors) {
    utils.log(summary, 'red');
    utils.log();
    errors.forEach(err => {
        utils.log(err.message || err);
        utils.log();
    });
}

// Print a detailed summary of build files.
function printFileSizes(stats, previousSizeMap) {
    var assets = stats.toJson().assets
        .filter(asset => /\.(js|css)$/.test(asset.name))
        .map(asset => {
            var fileContents = fs.readFileSync(paths.appBuild + '/' + asset.name);
            var size = gzipSize(fileContents);
            var previousSize = previousSizeMap[removeFileNameHash(asset.name)];
            var difference = getDifferenceLabel(size, previousSize);
            return {
                folder: path.join('build', path.dirname(asset.name)),
                name: path.basename(asset.name),
                size: size,
                sizeLabel: filesize(size) + (difference ? ' (' + difference + ')' : '')
            };
        });
    assets.sort((a, b) => b.size - a.size);
    var longestSizeLabelLength = Math.max.apply(null,
        assets.map(a => stripAnsi(a.sizeLabel).length)
    );
    assets.forEach(asset => {
        var sizeLabel = asset.sizeLabel;
        var sizeLength = stripAnsi(sizeLabel).length;
        if (sizeLength < longestSizeLabelLength) {
            var rightPadding = ' '.repeat(longestSizeLabelLength - sizeLength);
            sizeLabel += rightPadding;
        }
        console.log(
            '  ' + sizeLabel +
            '  ' + chalk.dim(asset.folder + path.sep) + chalk.cyan(asset.name)
        );
    });
}

function buildClient() {
    utils.log('Copy client build (should be created already)...');

    utils.copy(config.paths.clientBuild, './client');

    if (removeMapFiles) {
        let files = fs.walkSync(utils.path.packageRelative('./client'));
        for (let file of files) {
            if (file.endsWith('.map')) {
                fs.removeSync(file);
            }
        }
    }

    utils.log('Done.', 'green')
}

function copyDataFolder() {
    utils.ensureEmptyDir(utils.path.packageRelative('./data/config'));

    utils.copy('./server/data/', './data/');
}

build();