import helper from './_scriptsHelper';
helper.initEnv();

import * as fs from 'fs-extra';
import * as Git from 'nodegit';

import config from '../config/config';
import pathHelper from '../helpers/pathHelper';

function init() {
    let templateRegistry = fs.readJsonSync(pathHelper.moduleRelative('./assets/templates.json'));

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

    //TODO validation
    let serverTemplate = parts[1];
    let clientTemplate = parts[2];

    console.log('Downloading server template...');
    downloadTemplate(serverTemplate, templateRegistry.projects[project].server[serverTemplate], pathHelper.serverRelative('./'));
}

function downloadTemplate(templateName, templateInfo, directory) {
    //TODO check not empty
    fs.emptyDirSync(directory);

    return Git.Clone(templateInfo.repo, directory, {
            checkoutBranch: templateInfo.branch
        })
        .then((repository) => {
            console.log('Done!');
        })
        .catch((err) => {
            console.log(err);
            console.log(`Cannot download ${templateName} into ${directory}.`)
        });
}

init();