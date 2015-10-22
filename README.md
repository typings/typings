# TypeScript Definition Writer

[![NPM version][npm-image]][npm-url]
[![NPM downloads][downloads-image]][downloads-url]
[![Build status][travis-image]][travis-url]
[![Test coverage][coveralls-image]][coveralls-url]

> The TypeScript definition dependency manager.

## Installation

```sh
npm install tdw --global
```

## Usage

**TDW** provides a simple way for dependencies to be maintained and installed. By resolving over various sources recursively, type definitions can be recursively compiled into a single definition for bundling.

### Init

```sh
tdw init
```

Initialize a new package definition at this location.

### Install

```sh
tdw install [location] --name [name]
```

Install a package dependency, and optionally write it into the configuration file.

#### Flags

* **--save, -S** Save to `tdw.json`
* **--save-dev, -D** Save as a dev dependency to `tdw.json`
* **--save-ambient, -A** Save as an ambient dependency to `tdw.json`
* **--ambient** Write as an ambient dependency
* **--name** The name of the dependency

#### Possible Locations

* `http://<domain>/<path>`
* `file:<path>`
* `github:<org>/<repo>/<path>#<commit>`
* `bitbucket:<org>/<repo>/<path>#<commit>`
* `npm:<package>/<path>`
* `bower:<package>/<path>`

Where `path` can either be `tdw.json` file, a `.d.ts` file or empty.

### Uninstall

```sh
tdw uninstall [name]
```

### Writing Definitions

Writing a new type definition is as simple as creating a new package. Start with a new `tdw.json` file, and add dependencies as you would normally. When you publish on GitHub, locally, in a package or even on your own website, someone else can install it and use it.

```json
{
  "name": "tdw",
  "main": "path/to/definition.d.ts",
  "ambient": false,
  "author": "Blake Embrey <hello@blakeembrey.com>",
  "description": "The TypeScript definition dependency manager",
  "dependencies": {},
  "devDependencies": {},
  "ambientDependencies": {}
}
```

* **main** The entry point to the definition
* **browser** A string or map of paths to override when resolving
* **ambient** Specify that this definition must be installed as ambient
* **name** The name of the definition
* **dependencies** A map of dependencies that need installing
* **devDependencies** A map of development dependencies that need installing
* **ambientDependencies** A map of environment dependencies that need installing

**Please note:** The dependencies map can accept either strings, or an array of strings, as the location of the dependency. For most people, a string is more than enough. However, in some cases it's possible that a type definition is available at multiple locations and should be resolved to the first available. For example, publishing a type definition and referring to an `npm:<package>` that might not be installed. In this situation, you could have a second source as `github:<org>/<package>` to install from.

## License

MIT

[npm-image]: https://img.shields.io/npm/v/tdw.svg?style=flat
[npm-url]: https://npmjs.org/package/tdw
[downloads-image]: https://img.shields.io/npm/dm/tdw.svg?style=flat
[downloads-url]: https://npmjs.org/package/tdw
[travis-image]: https://img.shields.io/travis/TypedWriter/cli.svg?style=flat
[travis-url]: https://travis-ci.org/TypedWriter/cli
[coveralls-image]: https://img.shields.io/coveralls/TypedWriter/cli.svg?style=flat
[coveralls-url]: https://coveralls.io/r/TypedWriter/cli?branch=master
