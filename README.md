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

## Features

* Package manager parity
  * `init`, `install`, `rm`, `ls`, etc.
* Installation over GitHub, BitBucket, NPM, Bower and HTTP(s)
  * Dependencies will also be resolved the same way
* Simple typings package file
  * Specify dependencies in `typings.json` and everyone on the project can install it
* Name-spaced dependencies
  * TypeScript definitions will be name-spaced and properly contained from leaking type information irrelevant to the runtime

## Usage

**Typings** is the simple way for TypeScript definitions to be installed and maintained. It uses `typings.json`, which can resolve to GitHub, NPM, Bower, HTTP and from local files. Every package can use type definitions from different sources and with different versions, and know they will _never_ cause a conflict for their users.

```sh
typings install debug --save
```

The [public registry](https://github.com/typings/registry) is maintained by the community, and is used to resolve the official type definition for a JavaScript package.

### Init

```sh
typings init

Options: [--upgrade]
```

Initialize a new `typings.json` file. If you're currently using TSD, you can specify `--upgrade` to convert your current project to `typings.json`.

### Install

```sh
typings install # (with no arguments, in package directory)
typings install <pkg>[@<version>] [ --source [npm | github | bower | ambient | common] ]
typings install file:<path>
typings install github:<github username>/<github project>[/<path>][#<commit>]
typings install bitbucket:<bitbucket username>/<bitbucket project>[/<path>][#<commit>]
typings install <http:// url>
```

Write a dependency to the `typings/` directory, and optionally persist it in `typings.json`.

#### Flags

* **--save, -S** Save as a dependency in `typings.json`
* **--save-dev, -D** Save as a dev dependency in `typings.json`
* **--ambient, -A** Write as an ambient dependency (use with `--save` and `--save-dev`)
* **--name, -n** The name of the dependency (required for non-registry dependencies)

#### Possible Locations

* `http://<domain>/<path>`
* `file:<path>`
* `github:<org>/<repo>/<path>#<commit>`
* `bitbucket:<org>/<repo>/<path>#<commit>`
* `npm:<package>/<path>`
* `bower:<package>/<path>`

Where `path` can be a `typings.json` file, a `.d.ts` file, or empty. When the path is empty, or not a `d.ts` file, `typings.json` will be automatically appended to the path.

#### Registry

Typings installations without a location will be looked up in the [registry](https://github.com/typings/registry). For example, `typings install debug` will resolve to [this entry](https://github.com/typings/registry/blob/master/npm/debug.json) in the public registry. Anyone can contribute typings to the registry, just make a pull request.

#### Example

Install the `node` typings from DefinitelyTyped:

```
typings install github:DefinitelyTyped/DefinitelyTyped/node/node.d.ts#4ad9bef6cc075c904e034e73e1c993b9ad1ba81b --save --ambient --name node
```

The name is used in `typings.json` and for external module definitions, and it is always required (but inferred when using the registry). The `--save` flag is used to write to `typings.json`, which you can use to re-install your typings later. The `--ambient` flag is used to specify that we know that this dependency is ambient. We use the commit hash in the location for code immutability, since there's nothing worse than someone coming into the project and the compiler explodes because the type definition on `master` has changed.

### Uninstall

```sh
typings uninstall <pkg> [--ambient] [--save|--save-dev]
```

Remove a dependency from the `typings/` directory, and optionally remove from `typings.json`.

#### Flags

* **--save, -S** Remove from dependencies in `typings.json`
* **--save-dev, -D** Remove from dev dependencies in `typings.json`
* **--ambient, -A** Remove as an ambient dependency (use with `--save` and `--save-dev`)

### List

```sh
typings ls [--ambient]
```

Print the `typings` dependency tree. (This command resolves on demand and is not cached)

### Search

```sh
typings search [query]

Options: [--name] [--source] [--offset] [--limit]
```

Search the registry for available typings.

### Bundle

```sh
typings bundle --name [string]

Options: [--browser] [--out] [--source]
```

Bundle the current projects typings into an ambient module.

## FAQ

### Why?

* Typings uses external modules, not ambient modules (E.g. no `declare module "x"` in normal dependencies)
  * External module declarations are more portable and understandable
    * Ambient modules suffer from exposing implementation details, such as global interfaces that don't actually exist at runtime
  * External module declarations are used by the TypeScript compiler's "moduleResolution"
    * You contribute your typings directly back to the module author!
* Typings should cleanly represent the module structure
  * For example, support for the `browser` field (Webpack, Browserify, etc.) can produce different types at runtime
  * What about type definitions for every file? Some modules promote requiring into the dependencies for "add-ons"
* TypeScript modules should be publish-able to any package manager
  * Ambient modules can not be published to a package manager as other packages may rely on the same ambient module declaration which results in declaration conflicts
* Typings are decentralized
  * Anyone can write and install a missing type definition without friction
  * The author of a type definition can maintain their type definition in isolation from other typings

### Configuration

Supports configuration using [`rc`](https://github.com/dominictarr/rc). The configuration can come from CLI arguments, environment variables prefixed with `typings_` or `.typingsrc`.

* **proxy** A HTTP(s) proxy URI for outgoing requests

### `main.d.ts` And `browser.d.ts`

To simplify integration with TypeScript, two files - `typings/main.d.ts` and `typings/browser.d.ts` - are generated which reference all typings installed in the current project. To use this, you can add the reference to `tsconfig.json` files:

```json
{
  "files": [
    "typings/main.d.ts"
  ]
}
```

Or as a reference to the top of TypeScript files:

```ts
/// <reference path="../typings/main.d.ts" />
```

If you're building a front-end package it's recommended you use `typings/browser.d.ts` instead. The browser typings are compiled using the `browser` field overrides.

### References

During installation, any typings references (`/// <reference path="" />`) will be removed. This is because there's no simple way to include the contents from the other file within the project. With legacy projects, these references tend to denote both dependencies and ambient dependencies, and can't be relied on in any formal way.

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

#### Where do the type definitions install?

Typings are compiled and written into the `typings/` directory alongside `typings.json`. More specifically, the structure looks like this:

```
typings/{main,browser}/{ambient,definitions}/{dependency}/*
typings/{main,browser}.d.ts
```

Where `typings/{main,browser}.d.ts` is a compilation of references to installed definitions. Main and browser typings are written to separate directories for `tsconfig.json` exclude support - you can completely exclude either the primary or browser typings.

## License

MIT

[npm-image]: https://img.shields.io/npm/v/typings.svg?style=flat
[npm-url]: https://npmjs.org/package/typings
[downloads-image]: https://img.shields.io/npm/dm/typings.svg?style=flat
[downloads-url]: https://npmjs.org/package/typings
[travis-image]: https://img.shields.io/travis/typings/typings.svg?style=flat
[travis-url]: https://travis-ci.org/typings/typings
[coveralls-image]: https://img.shields.io/coveralls/typings/typings.svg?style=flat
[coveralls-url]: https://coveralls.io/r/typings/typings?branch=master
