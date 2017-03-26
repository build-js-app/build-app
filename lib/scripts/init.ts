import * as fs from 'fs-extra';
import * as Git from 'nodegit';
import * as Promise from 'bluebird';

import pathHelper from '../helpers/pathHelper';
import utils from '../helpers/utils';

export default {
    command: 'init',
    describe: 'Init new project',
    handler: commandHandler,
    builder: commandBuilder
};

function commandBuilder(yargs) {
    return yargs
        .option('project', {
            alias: 'p',
            description: 'Templates project'
        })
        .option('server', {
            alias: 's',
            description: 'Server template'
        })
        .option('client', {
            alias: 'c',
            description: 'Client template'
        })
        .option('default', {
            alias: 'df',
            description: 'Init with default templates'

        })
        .option('list', {
            alias: 'ls',
            description: 'Show list of templates'

        })
        .example('init -p simple -s ts -c react', 'inits project for templates "ts", "react" in project "simple"')
        .example('init --default', 'inits project with default templates')
        .example('init --list', 'show list of all available templates grouped by project');
}

function commandHandler(argv) {
    if (argv.list) {
        return showTemplatesList();
    }

    if (argv.default) {
        return initCommand('simple', 'ts', 'react');
    }

    let params = [argv.project, argv.server, argv.client];

    for (let param of params) {
        if (!param) {
            console.log(`Please specify project, server and client options or use defaults with --default option.`);
            return console.log(`Run init -h to get more information`);
        }
    }

    initCommand(argv.project, argv.server, argv.client);
}

function initCommand(project, serverTemplate, clientTemplate) {
    utils.log(`Init new project. Server template: ${serverTemplate}; client template: ${clientTemplate}; project: ${project}.`);

    let templatesInfo = getTemplatesInfo(project, serverTemplate, clientTemplate);

    let checkFolder = Promise.resolve(null);
    let root = pathHelper.projectRelative('./');
    if (!utils.isEmptyDir(root)) {
        utils.log('Project folder is not empty.', 'red');
        checkFolder = utils.prompt('Do you want to empty the folder?', true)
            .then((answer) => {
                if (!answer) {
                    process.exit(0);
                } else {
                    utils.logOperation('Empty project folder', () => {
                        utils.ensureEmptyDir(root);
                    })
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

            utils.log('Project was initialized!', 'green');
        })
}

function showTemplatesList() {
    let templateRegistry = utils.readJsonFile(pathHelper.moduleRelative('./assets/init/templates.json'));

    let logWithTabs = (message, tabs) => {
        let tabStr = '';
        for (let i = 0; i <= tabs - 1; i++) tabStr += ' ';
        utils.log(tabStr + message);
    };

    logWithTabs(`Projects:`, 0);

    for (let project of Object.keys(templateRegistry.projects)) {
        logWithTabs(project, 2);

        logWithTabs('server:', 4);
        for (let serverTemplate of Object.keys(templateRegistry.projects[project].server)) {
            logWithTabs(serverTemplate, 6);
        }

        logWithTabs('client:', 4);
        for (let clientTemplate of Object.keys(templateRegistry.projects[project].client)) {
            logWithTabs(clientTemplate, 6);
        }
    }

}

function getTemplatesInfo(project, serverTemplate, clientTemplate) {
    let templateRegistry = utils.readJsonFile(pathHelper.moduleRelative('./assets/init/templates.json'));

    let params = [];

    if (!templateRegistry.projects[project]) {
        let projects = Object.keys(templateRegistry.projects);
        utils.logAndExit(`Incorrect project name '${project}'. Valid values are: [${projects.join(', ')}].`);
    }

    let projectInfo = templateRegistry.projects[project];

    let serverTemplateInfo = projectInfo.server[serverTemplate];
    if (!serverTemplateInfo) {
        let templates = Object.keys(projectInfo.server);
        utils.logAndExit(`Incorrect server template '${serverTemplate}'. Valid values are: [${templates.join(', ')}].`);
    }
    serverTemplateInfo.name = serverTemplate;

    let clientTemplateInfo = projectInfo.client[clientTemplate];

    if (!clientTemplateInfo) {
        let templates = Object.keys(projectInfo.client);
        utils.logAndExit(`Incorrect client template '${clientTemplate}'. Valid values are: [${templates.join(', ')}].`);
    }
    clientTemplateInfo.name = clientTemplate;

    return {
        serverTemplate: serverTemplateInfo,
        clientTemplate: clientTemplateInfo
    }
}

function downloadTemplate(templateInfo, directory) {
    fs.emptyDirSync(directory);

    return Git.Clone(templateInfo.repo, directory, {
            checkoutBranch: templateInfo.branch
        })
        .then(() => {
            utils.removeDir(pathHelper.path.join(directory, '.git'));
        });
}

function copyAssets() {
    fs.copySync(
        pathHelper.moduleRelative('./assets/init/rootPackage.json'),
        pathHelper.projectRelative('./package.json')
    )
}