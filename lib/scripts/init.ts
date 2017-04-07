import * as fs from 'fs-extra';
import * as Git from 'nodegit';
import * as Promise from 'bluebird';
import * as chalk from 'chalk';
import * as validateProjectName from 'validate-npm-package-name';

import pathHelper from '../helpers/pathHelper';
import utils from '../helpers/utils';

export default {
    command: 'init <app-name>',
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
        .example('init my-app -p simple -s ts -c react', 'inits new app in "my-app" folder with templates "ts", "react" in project "simple"')
        .example('init my-app --default', 'inits project with default templates')
        .example('init my-app --list', 'show list of all available templates grouped by project');
}

function commandHandler(argv) {
    if (argv.list) {
        return showTemplatesList();
    }

    if (argv.default) {
        return initCommand(argv.appName, 'simple', 'ts', 'react');
    }

    let params = [argv.project, argv.server, argv.client];

    for (let param of params) {
        if (!param) {
            console.log(`Please specify project, server and client options or use defaults with --default option.`);
            return console.log(`Run init -h to get more information`);
        }
    }

    initCommand(argv.appName, argv.project, argv.server, argv.client);
}

function initCommand(appName, project, serverTemplate, clientTemplate) {
    checkAppName(appName);

    let templatesInfo = getTemplatesInfo(project, serverTemplate, clientTemplate);

    let checkFolder = Promise.resolve(null);
    let root = pathHelper.projectRelative(`./${appName}`);

    pathHelper.setAppPath(root);

    utils.log(`Init new project based on project "${project}".`);
    utils.log(`Server template: "${serverTemplate}".`);
    utils.log(`Client template: "${clientTemplate}".`);
    utils.log(`App folder: "${pathHelper.getAppPath()}".`);

    if (!utils.isEmptyDir(root)) {
        utils.log('Project folder is not empty.', 'red');
        checkFolder = utils.prompt('Do you want to empty the folder? All files will be deleted.', false)
            .then((answer) => {
                if (!answer) {
                    process.exit(0);
                } else {
                    utils.logOperation('Empty project folder', () => {
                        utils.ensureEmptyDir(root);
                    })
                }
            });
    } else {
        fs.ensureDirSync(root);
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
            copyAssets(appName);

            utils.log('Project was initialized!', 'green');
        })
}

function checkAppName(appName) {
    const validationResult = validateProjectName(appName);
    if (!validationResult.validForNewPackages) {
        console.error(
            `Could not create a project called ${chalk.red(`"${appName}"`)} because of npm naming restrictions:`
        );
        printValidationResults(validationResult.errors);
        printValidationResults(validationResult.warnings);
        process.exit(1);
    }
}

function printValidationResults(results) {
    if (typeof results !== 'undefined') {
        results.forEach(error => {
            console.error(chalk.red(`  *  ${error}`));
        });
    }
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
            let gitFolderPath = pathHelper.path.join(directory, '.git');
            utils.removeDir(gitFolderPath);
        });
}

function copyAssets(appName) {
    let packagePath = pathHelper.moduleRelative('./assets/init/rootPackage.json');
    let appPackage = fs.readJsonSync(packagePath);
    appPackage.name = appName;
    fs.writeJSONSync(pathHelper.projectRelative('./package.json'), appPackage);
}