import helper from './_scriptsHelper';
helper.initEnv();

import * as fs from 'fs-extra';
import * as Git from 'nodegit';
import * as Promise from 'bluebird';

import config from '../config/config';
import pathHelper from '../helpers/pathHelper';
import utils from '../helpers/utils';

function init() {
    let templateRegistry = fs.readJsonSync(pathHelper.moduleRelative('./assets/init/templates.json'));

    let args = process.argv.slice(2);

    let message = 'Please, specify project templates as a first argument in a format {project_name}:{server_template}:{client_template}';

    if (!args.length) {
        return console.log(message);
    }

    let parts = args[0].split(':');

    if (parts.length !== 3) {
        return console.log(message);
    }

    let project = parts[0];
    if (!templateRegistry.projects[project]) {
        let projects = Object.keys(templateRegistry.projects);
        return console.log(`Incorrect project name '${project}'. Valid values are: [${projects.join(', ')}].`);
    }

    let projectInfo = templateRegistry.projects[project];

    let serverTemplate = parts[1];
    let serverTemplateInfo = projectInfo.server[serverTemplate];
    if (!serverTemplateInfo) {
        let templates = Object.keys(projectInfo.server);
        return console.log(`Incorrect server template '${serverTemplate}'. Valid values are: [${templates.join(', ')}].`);
    }

    let clientTemplate = parts[2];
    let clientTemplateInfo = projectInfo.client[clientTemplate];
    if (!clientTemplateInfo) {
        let templates = Object.keys(projectInfo.client);
        return console.log(`Incorrect client template '${clientTemplate}'. Valid values are: [${templates.join(', ')}].`);
    }

    let checkFolder = Promise.resolve(null);
    let root = pathHelper.projectRelative('./');
    if (!utils.isEmptyDir(root)) {
        utils.log('Project folder is not empty.', 'red');
        checkFolder = utils.prompt('Do you want to empty the folder?', true)
            .then((answer) => {
                if (!answer) {
                    process.exit(0);
                } else {
                    utils.ensureEmptyDir(root);
                }
            });
    }


    checkFolder
        .then(() => {
            return utils.logOperationAsync('Downloading server template',
                downloadTemplate(serverTemplate, projectInfo.server[serverTemplate], pathHelper.serverRelative('./')));
        })
        .then(() => {
            return utils.logOperationAsync('Downloading client template',
                downloadTemplate(clientTemplate, projectInfo.client[clientTemplate], pathHelper.clientRelative('./')));
        })
        .then(() => {
            copyAssets();
        })
}

function downloadTemplate(templateName, templateInfo, directory) {
    //TODO check not empty
    fs.emptyDirSync(directory);

    return Git.Clone(templateInfo.repo, directory, {
            checkoutBranch: templateInfo.branch
        });
}

function copyAssets() {
    fs.copySync(
        pathHelper.moduleRelative('./assets/init/rootPackage.json'),
        pathHelper.projectRelative('./package.json')
    )
}

init();