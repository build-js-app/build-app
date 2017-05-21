import * as _ from 'lodash';
import * as fs from 'fs-extra';

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

async function commandHandler(argv) {
    if (!argv.sub_command) return;

    envHelper.checkFolderStructure();

    switch (argv.sub_command) {
        case 'archive':
            await utils.logOperation('Archive app sources', archive);
            break;
        default:
            break;
    }
}

async function archive() {
    let archiveDir = pathHelper.projectRelative(config.paths.archive.root);
    let archiveFileName = `${envHelper.getAppName()}_src.zip`;
    let archivePath = pathHelper.projectRelative(archiveFileName);

    utils.ensureEmptyDir(archiveDir);

    let exclude = [
        pathHelper.clientRelative(config.paths.client.build),
        pathHelper.projectRelative(config.paths.build.root),
        pathHelper.projectRelative(config.paths.deploy.root),
        pathHelper.projectRelative(config.paths.archive.root),
        pathHelper.serverRelative('./node_modules'),
        pathHelper.serverRelative(config.paths.server.build),
        pathHelper.serverRelative(config.paths.server.local),
        pathHelper.clientRelative('./node_modules'),
        archivePath
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

    await utils.archiveFolder(archiveDir, archivePath);

    utils.removeDir(archiveDir);
}