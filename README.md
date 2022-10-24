### Build App

**Build App** is a full-stack JS App build system. Inspired by Facebook's create-react-app and other client build systems it is going one step futher providing similar facilities for full-stack JS development.

The aim of the project is to simplify development of modern full-stack JS applications, providing most of basic dev operations out of the box (build, run dev mode, lint, etc).

It is provided with starter templates for Client/Server which you can combine to seed you project with technologies of your choice.

See deployed template here:

[React / PostgreSQL on Heroku](https://napp-full-tmp.herokuapp.com)

Use user_a@test.com / pas123 for login.

_Build App_ works is OS-agnostic.

## Getting started

```sh
# install build-app globally
npm install -g build-app

# see list of available commands
app-scripts --help

# init new project
app-scripts init

# change directory to new project folder
cd my-app

# seed project
app-scripts seed
```

To run server: open project in IDE (preferably VS Code) and use available configuration alternatively you can run it with `app-script serve -s`

To run client run in terminal: `app-scripts serve -c`

## Project structure

_Build App_ assumes some predefined project structure.

Project consists of server and client parts.

By default server part is located in {root}/server folder and client in {root}/client.

Those values can be overridden in build-app.config.

### Client:

Client is SPA written in one modern JS front-end frameworks (React/Angular/vue). They are using existing client side build systems (like create-react-app for React).

Build system expects to be able to create client build by running 'npm run build' command in client folder. Output is expected in {client}/build folder and index.html starts client SPA application.

More details how to setup client-side build you can find in docs for particular build system:

React: [create-react-app](https://github.com/facebookincubator/create-react-app)

### Server:

Both JS/TS js flavors are supported. For JS you can use latest language features like ES6, async/await and others. Code is compiled to ES5 during the build.

Server entry file should be located at ./src/index (.ts or .js).

There are some special folders

**data**: folder with data assets like data json files, email templates, etc.

**local**: folder where server writes data to, here you can have logs output, local overridden values for config file, file uploads, etc.

## app-script commands

After build-app is installed globally app-scripts command is available globally. It has different commands (scripts). Note instead of 'app-scripts' command you can use 'napp' alias.

### Init

_init_ command seeds empty project. There are separate templates for server and client parts.

For interactive init run init command with no parameters:

```sh
app-scripts init
```

To see all available templates run:

```sh
app-scripts init --list
```

To seed project with particular templates use --project --server --client options:

```sh
app-scripts init my-app --project simple --server ts --client react
```

To init basic IDE settings use option --ide (currently supported vs code only)

```
app-scripts init my-app --default --ide code
```

### Seed

_seed_ command do initial project setup. That includes installing dependencies, building server/client code, and running seed task if available in template. Note you can run install and build commands separately later.

```
app-scripts seed
```

### Install

_install_ command installs dependencies for both client and server project parts. It can use one of following package managers under the hood: npm, yarn, pnpm. If pnpm is installed globally it is used, then yarn used if available, then npm.

The same can be done manually with

```sh
cd {server_dir}
npm install

cd ../{client_dir}
npm install
```

### Build

_build_ command creates production ready build in build folder (./build by default).

To start server run index.js file. You may need to install dependencies first.

Build command builds server and client separately and then combines them together into deployable build package.

### Deploy

Deploys application to different sources (by using target parameter):

#### _local_ deployments:

```bash
app-scripts deploy
```

Build package copied to deployment folder (./deploy/local by default) and starts the application with one of supported process managers (forever or pm2). Following deployments will stop application first and clear all deploy folder content except local folder.

#### _heroku_ deployments:

Create new heroku app

Install heroku and login locally

```bash
npm i -g heroku
heroku login
```

For deployment run

```bash
# specify heroku app id for initial deployment
app-scripts deploy -t heroku -i dev --heroku-app my-heroku-id-for-dev
# for following deployment you can skip that
app-scripts deploy -t heroku -i dev
```

Note that that you can deploy to multiple instances corresponding to different environments (dev/staging), you have to create separate heroku apps for each
## Npm Scripts

Some operations are expected to be configured as particular npm scripts:

Build client - 'build' script (in client folder)

Serve client - 'start' script

Serve server - 'start' script (in server folder)

Also if pre-build/post-build scripts are defined in server/client package.json files corresponding scripts will be executed before/after server/client builds.

## Local development

For local development run

```bash
sudo npm link #(in package dir)
```
