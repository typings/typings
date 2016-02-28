# Typings

[![NPM version][npm-image]][npm-url]
[![NPM downloads][downloads-image]][downloads-url]
[![Build status][travis-image]][travis-url]
[![Test coverage][coveralls-image]][coveralls-url]
[![Gitter][gitter-image]][gitter-url]

> The manager for TypeScript definitions.

## Quick Start

```sh
# Install Typings CLI utility.
npm install typings --global

# Search for definitions.
typings search tape

# Find ambient typings (includes DefinitelyTyped in lookup due to --ambient flag).
typings search react --ambient

# Install ambient typings (and persist selection in `typings.json`).
typings install react --ambient --save

# Use `main.d.ts` (in `tsconfig.json` or as a `///` reference).
cat typings/main.d.ts
```

## From TSD to typings

**Important: For existing TSD users, Typings will install from DefinitelyTyped using the `--ambient` flag. Regular dependencies are maintained in the [registry](https://github.com/typings/registry).**

You're possibly wondering what it's like going from using TSD to Typings. To use Typings as you used TSD the migration is not extreme. Where you previously would have:

```
tsd install react --save
```

You would now:

```
typings install react --ambient --save
```

Likewise, this:

```
tsd query react
```

becomes:

```
typings search react --ambient
```

In both cases the `--ambient` flag is required in order that Definitely Typed is included in the lookup.  DT can generally be viewed as a source of ambient definitions; both internal and external.  For clarity about what ambient definitions are it's worth taking a look at the [TypeScript Handbook](http://www.typescriptlang.org/Handbook#modules-working-with-other-javascript-libraries).

## Features

* Package manager parity
  * Familiar commands like `init`, `install`, `rm` and `ls`
  * Support for installation of type definitions based on the true version number of the package you are using.  (Rather than on a SHA hash as with TSD.)  [Read more.](/docs/typings-the-registry-and-versions.md)
* Installation from GitHub, BitBucket, NPM dependencies, Bower dependencies and HTTP(s)
  * If a project uses Typings, you can install it locally - try `typings install npm:popsicle`
* Simple typings configuration file
  * Persist dependencies in `typings.json` and everyone on the project can replicate it
* Name-spaced dependencies (not for ambient dependencies - those are always global)
  * TypeScript definitions will be name-spaced and contained from leaky type information

## Usage

**Typings** is the simple way to manage and install TypeScript definitions. It uses `typings.json`, which can resolve to GitHub, NPM, Bower, HTTP and local files. Packages can use type definitions from various sources and different versions, and know they will _never_ cause a conflict for users.

```sh
typings install debug --save
```

A [public registry](https://github.com/typings/registry) is maintained by the community, and is used to resolve official type definitions for JavaScript packages.

### Init

```sh
typings init

Options: [--upgrade]
```

Initialize a new `typings.json` file. If you're currently using TSD, you can use `--upgrade` to convert `tsd.json` to `typings.json`.

### Install

```sh
typings install # (with no arguments, in package directory)
typings install <pkg>[@<version>] [ --source [npm | github | bower | ambient | common] ]
typings install file:<path>
typings install github:<github username>/<github project>[/<path>][#<commit>]
typings install bitbucket:<bitbucket username>/<bitbucket project>[/<path>][#<commit>]
typings install npm:<package>
typings install bower:<package>
typings install <https?:// url>
```

**Please note:** `npm` and `bower` resolve using their respective algorithms over the local filesystem. They will need to be installed _before_ running `typings install`. The other schemes (`http`, `https`, `github`, `bitbucket`) resolve over HTTP(s). Finally, `file` is a location in the local filesystem relative to the `typings.json` directory.

Write a dependency to the `typings/` directory, optionally persisting it in `typings.json`.

#### Flags

* **--save, -S** Save as a dependency in `typings.json`
* **--save-dev, -D** Save as a dev dependency in `typings.json`
* **--ambient, -A** Write as an ambient dependency (use with `--save` and `--save-dev`)
* **--name, -n** The name of the dependency (required for non-registry dependencies)

#### Registry

Installations without a specific location will looked up the [registry](https://github.com/typings/registry) using the [Typings API](https://github.com/typings/api). For example, `typings install debug` will resolve to [this data](https://github.com/typings/registry/blob/master/npm/debug.json). Anyone can contribute typings to the registry, just make a pull request.

#### Example

Install `node` typings:

```sh
typings install node --save --ambient
```

The name is persisted in `typings.json`. The `--save` flag is used to write to `typings.json`, which you can use to re-install your typings later. The `--ambient` flag is used to confirm that this dependency is ambient.

### Uninstall

```sh
typings uninstall <pkg> [--ambient] [--save | --save-dev]
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

Print the `typings` dependency tree. This command resolves on demand and is not _currently_ cached.

### Search

```sh
typings search [query] [--ambient]

Options: [--name] [--source] [--offset] [--limit]
```

Search the registry for available typings.

### Bundle

```sh
typings bundle --name [string]

Options: [--browser] [--out] [--source]
```

Bundle the current project types into an single ambient module.

## FAQ

### Why?

* Typings makes external modules, not ambient modules, first class.  (Curious as to what this means?  Read [this](/docs/how-typings-makes-external-modules-first-class.md))
  * A lot of ambient module declarations suffer from exposing implementation details incorrectly
  * External module declarations are emitted by TypeScript already, and used with the `moduleResolution` option
  * You can immediately contribute typings back to the author!
* Typings cleanly represents the module structure
  * Supporting the `browser` field (used by Webpack, Browserify, etc.) can produce different types
  * Need type definitions for each file? Done. Some modules promote requiring into the dependencies for "add-ons"
* TypeScript modules should be publish-able to any package manager
  * Ambient modules can not be published to a package manager
  * Publishing ambient modules to a package manager cripples your users that run into duplicate identifiers
* Typings are decentralized
  * Write and install your own type definitions without friction
  * Author can maintain type definitions in isolation from other typings (using separate GitHub repos, for example)

### Configuration

Typings supports configuration using [`rc`](https://github.com/dominictarr/rc). The config options can be set using CLI arguments, environment variables prefixed with `typings_` or a `.typingsrc` file.

* **proxy** A HTTP(s) proxy URI for outgoing requests
* **httpProxy** The proxy to use for HTTP requests (default: `process.env.HTTP_PROXY`)
* **httpsProxy** The proxy to use for HTTPS requests (default: `process.env.HTTPS_PROXY`)
* **noProxy** A string of space-separated hosts to not proxy (default: `process.env.NO_PROXY`)
* **rejectUnauthorized** Reject invalid SSL certificates (default: `true`)
* **ca** A string or array of strings of trusted certificates in PEM format
* **key** Private key to use for SSL (default: `null`)
* **cert** Public x509 certificate to use (default: `null`)
* **userAgent** Set the `User-Agent` for HTTP requests (default: `typings/{typingsVersion} node/{nodeVersion} {platform} {arch}`)

### `main.d.ts` And `browser.d.ts`

To simplify integration with TypeScript, two files - `typings/main.d.ts` and `typings/browser.d.ts` - are generated which reference all the typings installed in the project only one of which can be used at a time. If you're building a front-end package it's recommended you use `typings/browser.d.ts`. The browser typings are compiled by following the `browser` field overrides.

To use either you can do ***one*** of the following:

* If you are using `exclude` in `tsconfig.json`, then exclude the one you don't want (similar to `node_modules`) e.g:

```json
{
  "exclude": [
    "typings/browser.d.ts",
    "typings/browser",
    "node_modules"
  ]
}
```

* If you are using `files` in `tsconfig.json`, then add the one you want:

```json
{
  "files": [
    "typings/main.d.ts"
  ]
}
```

* If you are not using `tsconfig.json`, then add as a reference to the top of TypeScript files:

```ts
/// <reference path="../typings/main.d.ts" />
```

### References

During installation, any references (E.g. `/// <reference path="..." />`) are stripped. There is no simple way to include the contents from the other file within the project. With legacy projects, these references can denote dependencies or ambient dependencies, so can't be relied on in any formal way. Installation will print the references that were stripped during installation, and you can continue installation of dependencies yourself.

### How Do I Use Typings With Git and Continuous Integration?

If you're already publishing your module with TypeScript, you might be using NPM scripts to automate the build. To integrate **Typings** into this flow, I recommend you run it as part of the `prepublish` or `build` steps. For example:

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
  "author": "Blake Embrey <hello@blakeembrey.com>",
  "description": "The TypeScript definition dependency manager",
  "dependencies": {}
}
```

* **main** The entry point to the definition (canonical to "main" in NPM's `package.json`)
* **browser** A string or map of paths to override when resolving (following the [browser field specification](https://github.com/defunctzombie/package-browser-field-spec))
* **ambient** Denote that this definition _must_ be installed as ambient
* **name** The name of this definition
* **dependencies** A map of dependencies that need installing
* **devDependencies** A map of development dependencies that need installing
* **ambientDependencies** A map of environment dependencies that may need installing
* **ambientDevDependencies** A map of environment dev dependencies that may need installing

#### What Are Ambient Dependencies?

Ambient dependencies are type definitions that provide information about the environment. Some examples of "environment" dependencies are Node.js, Browserify, `window` and even `Array.prototype.map`. These are globals that already exist, you do not "require" them. If your package exposes a module and/or ambient dependencies, it's recommended you expose a way to install the ambient definitions (explain installation in the docs, for instance).

#### Should I Use The `typings` Field In `package.json`?

Maybe. If you're relying on typings to provide type dependencies, I recommend that you omit the `typings` entry for now. If you don't use the `typings.json` file, add `typings` in `package.json`. This is because TypeScript 1.6+ comes with node module resolution built-in, but unless all the packages in the NPM dependency tree have their own typings entry inline you'll be breaking TypeScript users of your library. Typings has complete support for the node module resolution strategy used in TypeScript.

#### Where do the type definitions install?

Typings are compiled and written into the `typings/` directory alongside `typings.json`. The structure looks like this:

```sh
typings/{main,browser}/{ambient,definitions}/<dependency>/<dependency>.d.ts
typings/{main,browser}.d.ts
```

Where `typings/{main,browser}.d.ts` is a collection of references to installed definitions. Main and browser typings are written to separate directories for `tsconfig.json` exclude support - you can completely exclude both the main or browser typings.

## Contributing

```sh
# Installation
# Fork this repo (https://github.com/typings/typings)
# Clone the fork (E.g. `https://github.com/<your_username>/typings.git`)
cd typings
npm run bootstrap

# Build
npm run build

# Test
npm run test
```

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
[gitter-image]: https://badges.gitter.im/typings/typings.svg
[gitter-url]: https://gitter.im/typings/typings?utm_source=badge&utm_medium=badge&utm_campaign=pr-badge
