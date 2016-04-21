# FAQ

- [Why do I need this?](#why)
- [I'm getting a bunch of Duplicate Identifiers](#module-resolutions)
- [My ambient dependencie(s) are not installed](#references)
- [How do I use Typings with version control?](#how-do-i-use-typings-with-version-control)
- [How do I write typings definitions?](#writing-typings-definitions)
- [How to configure typings?](#configuration)
- [What are ambient dependencies?](#what-are-ambient-dependencies)
- [Should I use the `typings` field in `package.json`?](#should-i-use-the-typings-field-in-packagejson)
- [Where do the type definitions install?](#where-do-the-type-definitions-install)
- [Types of type defintions](#types-of-typings)

Your have a different question? Open an issue and help us answer your question here!

## Why?

Typings consumes external module definitions and wraps them up into namespaced, global declarations. Curious as to what this means? Read [this](/docs/external-modules.md).

The idea is, with external module definitions, you can't implement any leaky information that will break other consumers. Once you omit all the leaky details, you can properly version dependencies - though it requires some hacky namespacing from Typings to work with the TypeScript compiler.

Type definitions for Typings can also come from anywhere on the internet, allowing new consumers of definitions that were previously restricted to a subset of tooling to distribute type definitions.

## Module Resolutions

When you install typings, two files, `typings/main.d.ts` and `typings/browser.d.ts`, are generated. They reference all the typings installed in the project, but only one should be used at a time. If you're building a front-end package, it's recommended you use `typings/browser.d.ts`. The browser typings are compiled by following the `browser` field overrides.

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

* If you are not using `tsconfig.json`, add as a reference to the top of TypeScript files:

```ts
/// <reference path="../typings/main.d.ts" />
```

## References

During installation, all references (E.g. `/// <reference path="..." />`) are stripped. They are stripped because of their ambiguous nature - it can not be determined if the reference should be included within the source or is a dependency. 90% of the time, it's better to strip. If the reference is something you require for the project to work, you can always install the references as dependencies manually.

## How Do I Use Typings With Version Control?

Normally, you won't need to commit your `typings/` folder, unless you have issues accessing typings (E.g. CI has a firewall) or it aligns with your teams policy.

If you're using NPM in your project with TypeScript, you might be using NPM scripts. To integrate **Typings** into this flow, I recommend you run it as part of the `prepublish` or `build` steps. For example:

```json
{
  "scripts": {
    "build": "rm -rf dist && tsc",
    "prepublish": "typings install && npm run build"
  }
}
```

**P.S.** Remember to `npm install typings --save-dev`, so it'll use the local copy in scripts.

If you're using another configuration, run `typings install` before you build. This installs the type definitions in `typings.json` before the TypeScript compiler runs.

## Writing Typings Definitions

Writing a type definition is as simple as creating a new package. Start by creating a new `typings.json` file, and add dependencies as normal. When you publish to GitHub, locally, alongside your package (NPM or Bower) or even to your own website, someone else can reference it and use it.

The formal interface is available in [`typings/core`](https://github.com/typings/core/blob/master/src/interfaces/config.ts).

You can also use [`generator-typings`](https://github.com/typings/generator-typings) to prepare the plumbing work for you.

## Configuration

Typings supports configuration using [`rc`](https://github.com/dominictarr/rc). The config options can be set using CLI arguments, environment variables prefixed with `typings_` or a `.typingsrc` file.

The formal interface is available in [`typings/core`](https://github.com/typings/core/blob/master/src/interfaces/rc.ts).

## What Are Ambient Dependencies?

Ambient dependencies are type definitions that are global or otherwise provide information about the environment. Some examples of "environment" dependencies are Node.js, Browserify, `window` and even `Array.prototype.map`. These are globals that exist at runtime, you do not "require" them. If your package exposes a module and/or ambient dependencies, it's recommended you expose a way to install the ambient definitions (explain installation in the docs, for instance).

## Should I Use The `typings` Field In `package.json`?

If you're a module author, absolutely!

However, it can't be used properly if any of your exposed API surface (the `.d.ts` files) have dependencies that come from `typings`.
In that case, you can rely on `typings.json` to include typings for your dependencies so that your user can use `typings install npm:<your package>` to install your typings.

Also, if you are using the `files` field in `package.json` to control which files will be available, remember to include `typings.json`.

## Where Do The Type Definitions Install?

Typings are compiled and written into the `typings/` directory alongside `typings.json`. The structure looks like this:

```sh
typings/{main,browser}/{ambient,definitions}/<dependency>/index.d.ts
typings/{main,browser}.d.ts
```

Where `typings/{main,browser}.d.ts` is a collection of references to installed definitions. Main and browser typings are written to separate directories for `tsconfig.json` exclude support - you can completely exclude both the main or browser typings.

## Types of Typings

There are two major types of type definitions - external modules and ambient definitions. Typings can install both. It supports modules by default, and also supports ambient declarations using the `--ambient` flag.

An module definition is considered "external" if it has an `import` or `export` declaration at the top-level. Everything else can be considered "ambient". In the past, without tooling such as Typings, we've relied on writing ambient definitions to define modules using the `declare module '...'` syntax. With Typings, it will end up the same (wrapped in `declare module '...'`), but the Typings tool is doing the wrapping so it can manage the dependency tree without namespace conflicts _and_ ensure nothing is leaking into the global namespace (unless it's `--ambient`, that's confirming to Typings you're OK with it polluting the global namespace).
