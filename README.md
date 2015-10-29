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

**TDW** provides a simple way for dependencies to be installed and maintained. By resolving over different sources recursively, type definitions can be compiled into a single definition for bundling - without any version conflicts.

### Init

```sh
tdw init
```

Initialize a new type definition at this location.

### Install

```sh
tdw install [location] --name [name]
```

Install a type dependency, and optionally save it in the configuration file.

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

Where `path` can either be `tdw.json` file, a `.d.ts` file or empty (it will automatically append `tdw.json` to the path).

### Uninstall

```sh
tdw uninstall [name]
```

### Writing Type Dependencies

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
* **browser** A string or map of paths to override when resolving (just like `browser` in `package.json`)
* **ambient** Specify that this definition _must_ be installed as ambient
* **name** The name of the definition
* **dependencies** A map of dependencies that need installing
* **devDependencies** A map of development dependencies that need installing
* **ambientDependencies** A map of environment dependencies that need installing

#### Multiple Dependency Sources

The dependencies map can accept either strings, or an array of strings, which points to the location of the dependency. For most people, a single string is more than enough. In some cases it's possible that a type definition is available from multiple locations and will be resolved to the first available. For example, publishing a type definition and referring to `npm:<package>` that might not be available. In this situation, you can have a second source as `github:<org>/<package>` to install from.

#### What Are Ambient Dependencies?

Ambient dependencies are definitions which provide an environment. Such dependencies could be `node`, `browserify`, `window` or even `Array.prototype.map`. These are globals that exist, you do not "require" them.

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
