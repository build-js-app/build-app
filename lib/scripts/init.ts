import helper from './_scriptsHelper';
helper.initEnv();

import * as fs from 'fs-extra';
import * as Git from 'nodegit';
import * as Promise from 'bluebird';

import config from '../config/config';
import pathHelper from '../helpers/pathHelper';
import utils from '../helpers/utils';

function init() {
    let args = process.argv.slice(2);

    let templatesInfo = getTemplatesInfo(args);

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
                downloadTemplate(templatesInfo.serverTemplate, pathHelper.serverRelative('./')));
        })
        .then(() => {
            return utils.logOperationAsync('Downloading client template',
                downloadTemplate(templatesInfo.clientTemplate, pathHelper.clientRelative('./')));
        })
        .then(() => {
            copyAssets();
        })
}

function getTemplatesInfo(args) {
    let logAndExit = (message) => {
        utils.log(message);
        process.exit(0);
    };

    let templateRegistry = fs.readJsonSync(pathHelper.moduleRelative('./assets/init/templates.json'));

    let message = 'Please, specify project templates as a first argument in a format {project_name}:{server_template}:{client_template}';

    let params = [];

    if (!args.length) {
        params = templateRegistry.defaults;
    } else {
        params = args[0].split(':');
    }

    if (params.length !== 3) {
        logAndExit(message);
    }

    let project = params[0];
    if (!templateRegistry.projects[project]) {
        let projects = Object.keys(templateRegistry.projects);
        logAndExit(`Incorrect project name '${project}'. Valid values are: [${projects.join(', ')}].`);
    }

    let projectInfo = templateRegistry.projects[project];

    let serverTemplate = params[1];
    let serverTemplateInfo = projectInfo.server[serverTemplate];
    serverTemplateInfo.name = serverTemplate;
    if (!serverTemplateInfo) {
        let templates = Object.keys(projectInfo.server);
        logAndExit(`Incorrect server template '${serverTemplate}'. Valid values are: [${templates.join(', ')}].`);
    }

    let clientTemplate = params[2];
    let clientTemplateInfo = projectInfo.client[clientTemplate];
    clientTemplateInfo.name = clientTemplate;
    if (!clientTemplateInfo) {
        let templates = Object.keys(projectInfo.client);
        logAndExit(`Incorrect client template '${clientTemplate}'. Valid values are: [${templates.join(', ')}].`);
    }

    return {
        serverTemplate: serverTemplateInfo,
        clientTemplate: clientTemplateInfo
    }
}

function downloadTemplate(templateInfo, directory) {
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