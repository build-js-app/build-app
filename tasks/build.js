//TODO
process.env.APP_DIR = 'd:\\Projects\\DP\\Admin_Center'; //'d:\\Projects\\makeapp-admin';
process.env.NODE_ENV = 'production';

var pathHelper = require('./helpers/pathHelper');
var utils = require('./helpers/utils');
var config = require('./config');
var webpack = require('webpack');
var chalk = require('chalk');
var fs = require('fs-extra');

var removeMapFiles = true;

function build() {
    var startTime = new Date();

    utils.log('Build project in ' + chalk.cyan(pathHelper.getAppPath()) + '.');

    utils.ensureEmptyDir(config.paths.package);

    buildServer(() => {
        buildClient();

        utils.log('Copying assets...');

        copyDataFolder();

        //index file to run app with production env params
        utils.copy(pathHelper.rootRelative('./tasks/templates/index.js'), './index.js');

        var endTime = new Date();
        var compilationTime = utils.getFormattedTimeInterval(startTime, endTime);

        utils.log('All Done!', 'green');
        utils.log('Compilation time: ' + chalk.cyan(compilationTime) + '.');

        if (config.server.run) {
            if (!config.server.bundleNodeModules) {
                utils.log('Installing dependencies...');

                utils.runCommand('npm', ['install'], {
                    path: pathHelper.packageRelative('.'),
                    errorMessage: 'Cannot install app dependencies',
                    successMessage: 'Done.'
                })
            }

            utils.log('Starting server...');

            utils.runCommand('node', ['index.js'], {
                path: pathHelper.packageRelative('.')
            });
        }
    });
}

function buildServer(cb) {
    console.log('Creating server bundle...');

    if (config.server.sourceLang === 'ts') {
        utils.runCommand('tsc', [], {
            path: pathHelper.appRelative('./server'),
            errorMessage: 'Cannot compile TypeScript',
            successMessage: 'TypeScript was compiled.'
        });
    }

    var webpackConfig = require('./webpack/webpack.config.server');

    webpackConfig.entry.push(pathHelper.appRelative(config.paths.serverEntry));

    webpackConfig.output.path = pathHelper.appRelative('./server/build');

    webpackConfig.resolveLoader.root = pathHelper.rootRelative('node_modules');

    if (!config.server.bundleNodeModules) {
        var nodeModules = {};
        var nodeModulesPath = pathHelper.appRelative('./server/node_modules');
        fs.readdirSync(nodeModulesPath)
            .filter(function(x) {
                return ['.bin'].indexOf(x) === -1;
            })
            .forEach(function(mod) {
                nodeModules[mod] = 'commonjs ' + mod;
            });

        webpackConfig.externals = nodeModules;
    }

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

        var serverPackagePath = pathHelper.appRelative('./server/package.json');
        var serverPackageJson = fs.readJsonSync(serverPackagePath);

        var buildPackageJson = {
            dependencies: serverPackageJson.dependencies
        };

        fs.outputJsonSync(pathHelper.packageRelative('./package.json'), buildPackageJson);

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
        let files = fs.walkSync(pathHelper.packageRelative('./client'));
        for (let file of files) {
            if (file.endsWith('.map')) {
                fs.removeSync(file);
            }
        }
    }

    utils.log('Done.', 'green')
}

function copyDataFolder() {
    utils.ensureEmptyDir(pathHelper.packageRelative('./data/config'));

    utils.copy('./server/data/', './data/');

    let localDataPath = pathHelper.packageRelative('./data/local');

    //TODO do not copy
    fs.removeSync(localDataPath);
}

build();