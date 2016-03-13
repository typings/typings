# ![Typings](https://cdn.rawgit.com/typings/typings/master/logo.svg)

[![NPM version][npm-image]][npm-url]
[![NPM downloads][downloads-image]][downloads-url]
[![Build status][travis-image]][travis-url]
[![Test coverage][coveralls-image]][coveralls-url]
[![Gitter][gitter-image]][gitter-url]

> The manager for TypeScript definitions.

**Updating from 0.6 to 0.7?** Make sure you `rm -rf typings/` and re-install them, the directory structure has changed.

## Quick Start

```sh
# Install Typings CLI utility.
npm install typings --global

# Search for definitions.
typings search tape

# Find an available definition (by name).
typings search --name react

# Install typings (DT is "ambient", make sure to enable the flag and persist the selection in `typings.json`).
typings install react --ambient --save

# Use `main.d.ts` (in `tsconfig.json` or as a `///` reference).
cat typings/main.d.ts
```

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

## Read More

* [Commands](docs/commands.md)
* [Coming from TSD?](docs/tsd.md)
* [Example typings](docs/examples.md)
* [Why external modules?](docs/external-modules.md)
* [About the registry](docs/registry.md)
* [FAQ](docs/faq.md)

## Configuration

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
* **githubToken** Set your GitHub for resolving `github:` locations
* **registryURL** Override the registry URL
* **defaultSource** Override the default installation source (E.g. when doing `typings install debug`) (default: `npm`)
* **defaultAmbientSource** Override the default ambient installation source (E.g. when doing `typings install node -A`) (default: `dt`)

## Contributing

```sh
# Installation
# Fork this repo (https://github.com/typings/typings)
# Clone the fork (E.g. `https://github.com/<your_username>/typings.git`)
cd typings

# Install modules
npm install

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
