import * as fs from 'fs-extra';
import * as _ from 'lodash';
import * as chalk from 'chalk';
import * as inquirer from 'inquirer';
import * as validateProjectName from 'validate-npm-package-name';

import pathHelper from '../helpers/pathHelper';
import gitHelper from '../helpers/gitHelper';
import utils from '../helpers/utils';
import envHelper from '../helpers/envHelper';
import config from '../config/config';

export default {
  command: 'init [app-name]',
  describe: 'Init new project',
  handler: commandHandler,
  builder: commandBuilder
};

const templateRegistry = utils.readJsonFile(pathHelper.moduleRelative('./assets/init/templates.json'));

const supportedIdes = {
  code: 'Visual Studio Code',
  ws: 'WebStorm'
};

function commandBuilder(yargs) {
  return (
    yargs
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
      .option('list', {
        alias: 'ls',
        description: 'Show list of templates'
      })
      // .option('ide', {
      //   description: 'Init with specified IDE settings'
      // })
      .example(
        'init my-app -p simple -s ts -c react',
        'inits new app in "my-app" folder with templates "ts", "react" in project "simple"'
      )
      .example('init', 'inits project with manual options selection')
      .example('init my-app --list', 'show list of all available templates grouped by project')
  );
}

function commandHandler(argv) {
  if (argv.list) {
    return showTemplatesList();
  }

  if (!argv.appName) {
    interactiveInit();
  } else {
    cliInit(argv);
  }
}

async function initCommand(appName, project, serverTemplate, clientTemplate, ide) {
  if (!checkAppName(appName)) process.exit(1);

  let templatesInfo = getTemplatesInfo(project, serverTemplate, clientTemplate);

  let root = pathHelper.projectRelative(`./${appName}`);

  pathHelper.setAppPath(root);

  utils.log(`Init new project based on project "${project}".`);
  utils.log(`Server template: "${serverTemplate}".`);
  utils.log(`Client template: "${clientTemplate}".`);
  utils.log(`Project folder: "${pathHelper.getAppPath()}".`);

  //check app folder
  if (utils.isEmptyDir(root)) {
    fs.ensureDirSync(root);
  } else {
    utils.log('Project folder is not empty.', 'red');

    let answer = await utils.prompt('Do you want to empty the folder? All files will be deleted.', false);

    if (!answer) {
      process.exit(0);
    } else {
      utils.logOperation('Empty project folder', () => {
        utils.ensureEmptyDir(root);
      });
    }
  }

  await utils.logOperation(
    'Downloading server template',
    downloadTemplate(templatesInfo.serverTemplate, pathHelper.serverRelative('./'))
  );

  await utils.logOperation(
    'Downloading client template',
    downloadTemplate(templatesInfo.clientTemplate, pathHelper.clientRelative('./'))
  );

  copyAssets(appName);

  if (!ide) ide = 'code'; //use vs code by default

  //TODO support JS
  if (ide && envHelper.isTsServerLang()) {
    initIde(ide);
  }

  initLinter();

  utils.log(`Project was initialized! Change directory to project folder '${appName}'.`, 'green');
}

function checkAppName(appName) {
  const validationResult = validateProjectName(appName);
  if (!validationResult.validForNewPackages) {
    console.error(`Could not create a project called ${chalk.red(`"${appName}"`)} because of npm naming restrictions:`);
    printValidationResults(validationResult.errors);
    printValidationResults(validationResult.warnings);
    return false;
  }
  return true;
}

function printValidationResults(results) {
  if (typeof results !== 'undefined') {
    results.forEach(error => {
      console.error(chalk.red(`  *  ${error}`));
    });
  }
}

function showTemplatesList() {
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
  let params = [];

  if (!templateRegistry.projects[project]) {
    let projects = Object.keys(templateRegistry.projects);
    utils.assertValueIsInTheList(project, projects, `Incorrect project name '${project}'.`);
  }

  let projectInfo = templateRegistry.projects[project];

  let serverTemplateInfo = projectInfo.server[serverTemplate];
  if (!serverTemplateInfo) {
    let templates = Object.keys(projectInfo.server);
    utils.assertValueIsInTheList(serverTemplate, templates, `Incorrect server template '${serverTemplate}'.`);
  }
  serverTemplateInfo.name = serverTemplate;

  let clientTemplateInfo = projectInfo.client[clientTemplate];

  if (!clientTemplateInfo) {
    let templates = Object.keys(projectInfo.client);
    utils.assertValueIsInTheList(clientTemplate, templates, `Incorrect client template '${clientTemplate}'.`);
  }
  clientTemplateInfo.name = clientTemplate;

  return {
    serverTemplate: serverTemplateInfo,
    clientTemplate: clientTemplateInfo
  };
}

async function downloadTemplate(templateInfo, directory) {
  await gitHelper.downloadGitRepository(templateInfo.origin, templateInfo.repo, templateInfo.branch, directory);
}

function copyAssets(appName) {
  let packagePath = pathHelper.moduleRelative('./assets/init/rootPackage.json');
  let appPackage = fs.readJsonSync(packagePath);
  appPackage.name = appName;
  fs.writeJSONSync(pathHelper.projectRelative('./package.json'), appPackage);

  fs.copySync(pathHelper.moduleRelative('./assets/init/_gitignore'), pathHelper.projectRelative('./.gitignore'));

  fs.copySync(pathHelper.moduleRelative('./assets/init/.prettierrc'), pathHelper.projectRelative('./.prettierrc'));

  let tsconfigPath = pathHelper.serverRelative('./tsconfig.json');
  if (!fs.existsSync(tsconfigPath)) {
    fs.copySync(pathHelper.moduleRelative('./assets/init/tsconfig.json'), tsconfigPath);
  }

  fs.copySync(
    pathHelper.moduleRelative('./assets/init/quickTest.ts'),
    pathHelper.serverRelative(config.paths.server.src, './quickTest.ts')
  );

  //copy client build placeholder
  let clientIndexPath = pathHelper.clientRelative(config.paths.client.build, './index.html');

  if (!fs.existsSync(clientIndexPath)) {
    utils.ensureEmptyDir(pathHelper.clientRelative(config.paths.client.build));
    fs.copySync(pathHelper.moduleRelative('./assets/init/clientBuildPlaceholder.html'), clientIndexPath);
  }
}

function checkIdeOption(ide) {
  let ides = Object.keys(supportedIdes);
  if (ides.indexOf(ide) === -1) {
    utils.logAndExit(`Incorrect IDE value, supported IDEs are [${ides.join(', ')}].`);
  }
}

function initIde(ide) {
  let lang = envHelper.isTsServerLang() ? 'ts' : 'js';

  if (ide === 'ws') {
    let jsLevel = envHelper.isUsingReact() ? 'JSX' : 'ES6';
    let context = {
      JS_LEVEL: jsLevel
    };
    let from = pathHelper.moduleRelative(`./assets/ide/ws/${lang}`);
    let to = pathHelper.projectRelative('./.idea');
    utils.copyTemplateFolder(from, to, context);
  }

  if (ide === 'code') {
    let from = pathHelper.moduleRelative(`./assets/ide/code/${lang}`);
    let to = pathHelper.projectRelative('./.vscode');
    utils.copyTemplateFolder(from, to);
  }
}

function initLinter() {
  if (envHelper.isTsServerLang) {
    let from = pathHelper.moduleRelative('./assets/linter/tslint.json');
    let to = pathHelper.serverRelative('./tslint.json');
    fs.copySync(from, to);
  }
}

function cliInit(argv) {
  if (argv.ide) {
    checkIdeOption(argv.ide);
  }

  let params = [argv.project, argv.server, argv.client];

  for (let param of params) {
    if (!param) {
      console.log(`Please specify project, server and client options.`);
      return console.log(`Run init -h to get more information`);
    }
  }

  initCommand(argv.appName, argv.project, argv.server, argv.client, argv.ide);
}

function interactiveInit() {
  utils.log('Initialize new app:', 'cyan');

  let getProjectChoices = () => {
    let projects = Object.keys(templateRegistry.projects);
    return projects.map(p => ({value: p, name: templateRegistry.projects[p].description}));
  };

  let getTemplatesOptions = (p, group) => {
    let project = templateRegistry.projects[p];
    return Object.keys(project[group]).map(t => ({
      value: t,
      name: project[group][t].description
    }));
  };

  let questions = [
    {
      type: 'input',
      name: 'appName',
      message: 'What is you app name?',
      validate: value => {
        return checkAppName(value);
      }
    },
    {
      type: 'list',
      name: 'project',
      message: 'Choose from available projects',
      choices: getProjectChoices()
    },
    {
      type: 'list',
      name: 'server',
      message: 'Choose back-end template:',
      choices: answers => getTemplatesOptions(answers.project, 'server')
    },
    {
      type: 'list',
      name: 'client',
      message: 'Choose front-end template:',
      choices: answers => getTemplatesOptions(answers.project, 'client')
    },
    {
      type: 'list',
      name: 'ide',
      message: 'Choose IDE/editor:',
      choices: answers => [
        {name: 'VS Code', value: 'code'},
        //TODO enable when ready
        //{name: 'WebStorm', value: 'ws'},
        {name: 'None', value: 'none'}
      ]
    }
  ];

  inquirer.prompt(questions).then(answers => {
    initCommand(answers.appName, answers.project, answers.server, answers.client, answers.ide);
  });
}
