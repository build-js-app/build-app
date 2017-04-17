### Build App

**Build App** is a full-stack JS App build system. Inspired by Facebook's create-react-app and other client build systems it is going one step futher providing similar facilities for full-stack JS development.

The aim of the project is to simplify development of modern full-stack JS applications, providing most of basic dev operations out of the box (build, run dev mode, lint, etc).

Besides that it provides number of build in starter templates which will help you get started ASAP. There are number of technology choises such as React/Vue/Angular for client, Mongo/Postgres for storage, etc.

*Build App* works on macOS, Windows, and Linux.
Project is in early stage of development. 
If something doesn’t work please file an issue.

## Getting started

```sh
# install build-app globally
npm install -g build-app

# see list of available commands
app-scripts --help

# init empty project with default templates
app-scripts init my-app --default

# change directory to new project folder
cd my-app

# install project dependencies
app-scripts install

# build project for production (and before running in dev mode)
app-scripts build

# serve project in dev mode
app-scripts serve --server (--client)

```

## Project structure

*Build App* assumes some predifined project structure.

Project consists of server and client parts.

By default server part is located in {root}/server folder and client in {root}/client.

Those values can be overriden in build-app.config.

### Client:

Client is SPA written in one modern JS front-end frameworks. Officially supported are React, Vue and Angular2. They are using existing client side build systems (create-react-app, vbuild and angular-cli respectively).

Build system expects to be able to create client build by running 'npm run build' command in client folder. Output is expected in {client}/build folder and index.html starts client SPA application.

More details how to setup client-side build you can find in docs for particualr build system:

React: [create-react-app](https://github.com/facebookincubator/create-react-app)

Vue: [vbuild](https://github.com/egoist/vbuild)

Angular: [angular-cli](https://github.com/angular/angular-cli)

### Server:

Both JS/TS js flavors are supported. For JS you can use latest language features like ES6, async/await and others. Code is compiled to ES5 during the build.

Server entry file should be located at ./src/index (.ts or .js). 

There are some special folders

**data**: folder with data assets like data json files, email templates, etc.

**local**: folder where server writes data to, here you can have logs output, local overrided values for config file, file uploads, etc.

## app-script commands

After build-app is installed globally app-scripts command is available globally. It has different commands (scripts).

### Init
*init* command seeds empty project. There are separate templates for server and client parts.

To see all available templates run:

```sh
app-scripts init --list
```

To seed project with particular templates use --project --server --client options:

```sh
app-scripts init my-app --project simple --server ts --client react
```

### Install

*install* command installs dependencies for both client and server project parts. It is using 'yarn' if available otherwise 'npm'.

The same can be done manually with

```sh
cd {server_dir}
npm install

cd ../{client_dir}
npm install
``` 

### Build

*build* command creates production ready build in build folder (./build by default).

To start server run index.js file. You may need to install dependencies first.

Build command builds server and client separately and then combines them together into build package.

## Road map

Project is in active development. The next planned features are:

* Custom dev mode for server (faster TS builds, build in linting)

* Deploy command

* Unit tests

You are welcome to submit a new feature request.
