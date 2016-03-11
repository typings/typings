# FAQ

Help us answer your common questions here!

## Why?

* Typings makes external modules, not ambient modules, first class.  (Curious as to what this means?  Read [this](/docs/external-modules.md))
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

## `main.d.ts` And `browser.d.ts`

To simplify integration with TypeScript, two files - `typings/main.d.ts` and `typings/browser.d.ts` - are generated which reference all the typings installed in the project only one of which can be used at a time. If you're building a front-end package it's recommended you use `typings/browser.d.ts`. The browser typings are compiled by following the `browser` field overrides.

To use either you can do **one** of the following:

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

## References

During installation, any references (E.g. `/// <reference path="..." />`) are stripped. There is no simple way to include the contents from the other file within the project. With legacy projects, these references can denote dependencies or ambient dependencies, so can't be relied on in any formal way. Installation will print the references that were stripped during installation, and you can continue installation of dependencies yourself.

## How Do I Use Typings With Git and Continuous Integration?

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

## How Do I Write Typings Definitions?

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
* **postmessage** A message to emit to users after installation
* **version** The semver range this definition is typed for
* **dependencies** A map of dependencies that need installing
* **devDependencies** A map of development dependencies that need installing
* **ambientDependencies** A map of environment dependencies that may need installing
* **ambientDevDependencies** A map of environment dev dependencies that may need installing

## What Are Ambient Dependencies?

Ambient dependencies are type definitions that provide information about the environment. Some examples of "environment" dependencies are Node.js, Browserify, `window` and even `Array.prototype.map`. These are globals that already exist, you do not "require" them. If your package exposes a module and/or ambient dependencies, it's recommended you expose a way to install the ambient definitions (explain installation in the docs, for instance).

## Should I Use The `typings` Field In `package.json`?

Maybe. If you're relying on typings to provide type dependencies, I recommend that you omit the `typings` entry for now. If you don't use the `typings.json` file, add `typings` in `package.json`. This is because TypeScript 1.6+ comes with node module resolution built-in, but unless all the packages in the NPM dependency tree have their own typings entry inline you'll be breaking TypeScript users of your library. Typings has complete support for the node module resolution strategy used in TypeScript.

## Where do the type definitions install?

Typings are compiled and written into the `typings/` directory alongside `typings.json`. The structure looks like this:

```sh
typings/{main,browser}/{ambient,definitions}/<dependency>/index.d.ts
typings/{main,browser}.d.ts
```

Where `typings/{main,browser}.d.ts` is a collection of references to installed definitions. Main and browser typings are written to separate directories for `tsconfig.json` exclude support - you can completely exclude both the main or browser typings.
