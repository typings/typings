# Typings

[![NPM version][npm-image]][npm-url]
[![NPM downloads][downloads-image]][downloads-url]
[![Build status][travis-image]][travis-url]
[![Test coverage][coveralls-image]][coveralls-url]

> The type definition manager for TypeScript.

## Installation

```sh
npm install typings --global
```

## Usage

**Typings** is a simple way for type dependencies to be installed and maintained. It uses a `typings.json` file that can resolve  from GitHub, NPM, Bower, HTTP and from local files. Packages can use type definitions with different sources and versions, and know they will _never_ cause a conflict.

```sh
typings install debug --save
```

There's an [open registry](https://github.com/typings/registry) maintained by the community, which is used to resolve to the official typing for a package.

### Init

```sh
typings init
```

Initialize a new `typings.json` file.

### Install

```sh
typings install # (with no arguments, in package directory)
typings install <pkg>[@<version>] --source [npm | github | bower | ambient | common]
typings install file:<path>
typings install github:<github username>/<github project>[/<path>][#<commit>]
typings install bitbucket:<bitbucket username>/<bitbucket project>[/<path>][#<commit>]
typings install <http:// url>
```

Install a dependency into the `typings` directory, and optionally save it in the configuration file.

#### Flags

* **--save, -S** Save as a dependency in `typings.json`
* **--save-dev, -D** Save as a dev dependency in `typings.json`
* **--save-ambient, -A** Save as an ambient dependency in `typings.json`
* **--ambient** Write as an ambient dependency (enabled when using `--save-ambient`)
* **--name** The name of the dependency (required for non-registry dependencies)

#### Possible Locations

* `http://<domain>/<path>`
* `file:<path>`
* `github:<org>/<repo>/<path>#<commit>`
* `bitbucket:<org>/<repo>/<path>#<commit>`
* `npm:<package>/<path>`
* `bower:<package>/<path>`

Where `path` can be a `typings.json` file, a `.d.ts` file, or empty (it will automatically append `typings.json` to the path when it is not a `.d.ts` file).

#### Registry

Package installation without a location will be looked up in the [registry](https://github.com/typings/registry). For example, `typings install debug` will resolve to [this entry](https://github.com/typings/registry/blob/master/npm/debug.json) in the registry. Anyone can contribute their own typings to the registry, just open a pull request.

### Uninstall

```sh
typings uninstall <pkg> [--ambient] [--save|--save-dev|--save-ambient]
```

Remove a dependency from the `typings` directory, and optionally remove from the configuration file.

#### Flags

* **--save** Remove from dependencies in `typings.json`
* **--save-dev** Remove from dev dependencies in `typings.json`
* **--save-ambient** Remove from ambient dependencies in `typings.json`
* **--ambient** Remove as an ambient dependency (enabled when using `--save-ambient`)

### List

```sh
typings ls [--ambient]
```

Print the `typings` dependency tree. (This command resolves on demand and is not cached)

## FAQ

### How Do I Use Typings With Git and Continuous Integration?

If you're already publishing your module with TypeScript, you're probably using NPM scripts to automate the build. To integrate **typings** into this flow, I recommend you run it as part of the `prepublish` or `build` steps. For example:

```json
{
  "scripts": {
    "build": "rm -rf dist && tsc",
    "prepublish": "typings install && npm run build"
  }
}
```

If you're using some other set up, just run `typings install` before you execute the build step. This will install the type definitions from `typings.json` before the TypeScript compiler runs.

### How Do I Write Typings Definitions?

Writing a new type definition is as simple as creating a new package. Start by creating a new `typings.json` file, then add dependencies as normal. When you publish to GitHub, locally, alongside your package (NPM or Bower) or even to your own website, someone else can reference it and use it.

```json
{
  "name": "typings",
  "main": "path/to/definition.d.ts",
  "ambient": false,
  "author": "Blake Embrey <hello@blakeembrey.com>",
  "description": "The TypeScript definition dependency manager",
  "dependencies": {},
  "devDependencies": {},
  "ambientDependencies": {}
}
```

* **main** The entry point to the definition (canonical to "main" in NPM's `package.json`)
* **browser** A string or map of paths to override when resolving (canonical to "browser" in NPM's `package.json`)
* **ambient** Specify that this definition _must_ be installed as ambient (also inferred from the type definition)
* **name** The name of the definition
* **dependencies** A map of dependencies that need installing
* **devDependencies** A map of development dependencies that need installing
* **ambientDependencies** A map of environment dependencies that need installing

#### Can I Use Multiple Sources?

The values of the dependency map can be a string, or an array of strings, which point to the location of the type information. For most cases, using a string is enough. In some cases, however, it's possible that a type definition becomes available over multiple sources. In this case, **typings** will resolve to the first available entry. For example, publishing a type definition that refers to `npm:<package>` will resolve before `github:<org>/<package>`, but only when the package is installed.

#### What Are Ambient Dependencies?

Ambient dependencies are type definitions which provide information about an environment. Some examples of these dependencies are `node`, `browserify`, `window` or even `Array.prototype.map`. These are globals that _need_ to exist, but you do not "require" them.

#### Should I Use The `typings` Field In `package.json`?

Maybe. If you're relying on typings to provide the type dependencies, I recommend that you omit the `typings` entry for now. If you don't use the `typings.json` file, add `typings` in `package.json`. This is because TypeScript 1.6+ comes with node module resolution built-in, but unless all the packages in the NPM dependency tree have their own typings entry inline you'll be breaking TypeScript users of your library. Typings has complete support for the node module resolution strategy in TypeScript.

## License

MIT

[npm-image]: https://img.shields.io/npm/v/typings.svg?style=flat
[npm-url]: https://npmjs.org/package/typings
[downloads-image]: https://img.shields.io/npm/dm/typings.svg?style=flat
[downloads-url]: https://npmjs.org/package/typings
[travis-image]: https://img.shields.io/travis/typings/cli.svg?style=flat
[travis-url]: https://travis-ci.org/typings/cli
[coveralls-image]: https://img.shields.io/coveralls/typings/cli.svg?style=flat
[coveralls-url]: https://coveralls.io/r/typings/cli?branch=master
