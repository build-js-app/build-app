import * as _ from 'lodash';
import * as fs from 'fs-extra';
import * as Promise from 'bluebird';

import utils from '../helpers/utils';
import pathHelper from '../helpers/pathHelper';
import config from '../config/config';
import envHelper from '../helpers/envHelper';
import packagesHelper from '../helpers/packagesHelper';

export default {
    command: 'extras [sub_command] [options]',
    describe: 'Additional commands (undocumented features)',
    handler: commandHandler,
    builder: commandBuilder
};

function commandBuilder(yargs) {
    return yargs
        .example('napp extras archive', 'Archive app sources');
}

function commandHandler(argv) {
    if (!argv.sub_command) return;

    envHelper.checkFolderStructure();

    switch (argv.sub_command) {
        case 'archive':
            archive();
            break;
        default:
            break;
    }
}

function archive() {
    let archiveDir = pathHelper.projectRelative(config.paths.archive.root);

    let archiveOperation = Promise.resolve(null)
        .then(() => {
            utils.ensureEmptyDir(archiveDir);

            let exclude = [
                pathHelper.clientRelative(config.paths.client.build),
                pathHelper.projectRelative(config.paths.build.root),
                pathHelper.projectRelative(config.paths.deploy.root),
                pathHelper.projectRelative(config.paths.archive.root),
                pathHelper.serverRelative('./node_modules'),
                pathHelper.serverRelative(config.paths.server.build),
                pathHelper.serverRelative(config.paths.server.local),
                pathHelper.clientRelative('./node_modules')
            ];

            fs.copySync(pathHelper.projectRelative('./'), archiveDir, {
                filter: (path) => {
                    for (let excludePath of exclude) {
                        if (_.startsWith(path, excludePath)) {
                            return false;
                        }
                    }

                    return true;
                }
            });

            let archiveFileName = `${envHelper.getAppName()}_src.zip`;
            return utils.archiveFolder(archiveDir, pathHelper.projectRelative(archiveFileName));
        })
        .then(() => {
            utils.removeDir(archiveDir);
        });

    utils.logOperationAsync('Archive app sources', archiveOperation);
}