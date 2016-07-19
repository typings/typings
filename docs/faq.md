# FAQ

- [Why do I need this?](#why)
- [I'm getting a bunch of Duplicate Identifiers](#module-resolutions)
- [My global dependencie(s) are not installed](#references)
- [How do I use Typings with version control?](#how-do-i-use-typings-with-version-control)
- [How do I write typings definitions?](#writing-typings-definitions)
- [How do I configure typings with `.typingsrc`?](#configuration)
- [What are global dependencies?](#what-are-global-dependencies)
- [Should I use the `typings` field in `package.json`?](#should-i-use-the-typings-field-in-packagejson)
- [Where do the type definitions install?](#where-do-the-type-definitions-install)
- [Types of type defintions](#types-of-typings)
- [Why `npm:<package>`?](#about-npmpkg)

Have a different question? Open an issue or pull request and we can add it here!

## Why?

Typings consumes external module definitions and wraps them up into namespaced, global declarations. Curious as to what this means? Read [this](/docs/external-modules.md).

The idea is, with external module definitions, you can't implement any leaky information that will break other consumers. Once you omit all the leaky details, you can properly version dependencies - though it requires some hacky namespacing from Typings to work with the TypeScript compiler.

Type definitions for Typings can also come from anywhere on the internet, allowing new consumers of definitions that were previously restricted to a subset of tooling to distribute type definitions.

## Module Resolutions

When you install typings, the default resolution is using "main" and is placed in the `typings/` directory. The file, `typings/index.d.ts`, is used as a bundle to reference all typings installed in the project. Typings also supports "browser" resolution logic, and can also emit both at once. See "[where do the type definitions install?](#where-do-the-type-definitions-install)" on how to emit "browser" definitions.

* If you are using `files` in `tsconfig.json`, add the index file:

```json
{
  "files": [
    "typings/index.d.ts"
  ]
}
```

* If you are not using `tsconfig.json`, add as a reference to the top of TypeScript files:

```ts
/// <reference path="../typings/index.d.ts" />
```

## References

During installation, all references (E.g. `/// <reference path="..." />`) are stripped. They are stripped because of their ambiguous nature - it can not be determined if the reference should be included within the source or is a dependency. If the reference is something you require for the project to work, you can always install the references as dependencies manually.

The biggest example of this behaviour is from DefinitelyTyped (`dt`). All dependencies (direct or in-direct) in DefinitelyTyped are managed through references. If you install something from DefinitelyTyped and it says a reference was stripped, it will probably need to be installed manually for the definition to work. You can install these dependencies by using the stripped URL printed on the screen directly, or you can search for the definition using the `typings search` command. For example:

![image](https://cloud.githubusercontent.com/assets/1088987/16957595/da30f4e8-4d91-11e6-913b-b703b71e9315.png)

![image](https://cloud.githubusercontent.com/assets/1088987/16961677/679af084-4da3-11e6-8129-c8a89dcf60ad.png)

![image](https://cloud.githubusercontent.com/assets/1088987/16961698/82fec972-4da3-11e6-83fd-46b7e7b977ec.png)

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

If you have special connection requirements, you can setup your connection configuration with a `.typingsrc` file. Typings looks for it in the user's home directory (eg: `c:\Users\myName\` on Windows, `$HOME` / `~` on Linux), and in the current working directory. More details on setting up rc configuration files can be found from the [rc package](https://github.com/dominictarr/rc).

 ### Example configuration

This `.typingsrc` file shows how to disable SSL when connecting from behind a corporate firewall.

```ini
 registryURL=http://api.typings.org/
 rejectUnauthorized=false
```

`.typingsrc` also supports json format. The above settings can be written as:
```json
{
  "rejectUnauthorized": false,
  "registryURL": "http://api.typings.org/"
}
```

|   **_Property_**   |                                                                                                                                                                                                                                                                                            **_Description_**                                                                                                                                                                                                                                                                                             |
|--------------------|----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| proxy              | A HTTP(s) proxy URI for outgoing requests. Setting this sets both httpProxy and httpsProxy if they are not set, as this is used as a fallback variable for both `httpProxy` and `httpsProxy`. An example setting might be, `"http://127.0.0.1:8888/"` [or a real proxy from incloak.com/proxy-list/](http://incloak.com/proxy-list/). If your proxy requires authentication, you may need to include a username and password in your url: `"http://domain\\myusername:password@myproxyServer:port"`, or if you are *not* on an AD domain: `"http://username:mypassword@myProxyServer:port"`</p>          |
| httpProxy          | See "proxy" details above. (defaults to `proxy` property above, if no `proxy` is set, defaults to `process.env.HTTP_PROXY`).                                                                                                                                                                                                                                                                                                                                                                                                                                                                             |
| httpsProxy         | See "proxy" details above. (defaults to `proxy` property above, if no `proxy` is set, defaults to `process.env.HTTPS_PROXY`).  Typically an `https` address used, but for troubleshooting `http` can be used.                                                                                                                                                                                                                                                                                                                                                                                            |
| noProxy            | A string of space-separated hosts to *not* proxy (default: `process.env.NO_PROXY`).                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      |
| rejectUnauthorized | Reject invalid SSL certificates (default: `true`). Useful behind (corporate) proxies that act like man-in-the middle on https connections.                                                                                                                                                                                                                                                                                                                                                                                                                                                               |
| ca                 | A string or array of strings of trusted certificates in PEM format.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      |
| key                | Private key to use for SSL.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              |
| cert               | Public x509 certificate to use.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          |
| userAgent          | Set the User-Agent for HTTP requests (default: `"typings/{typingsVersion} node{nodeVersion} {platform} {arch}"`).                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        |
| githubToken        | Add your GitHub token for resolving `github:*` locations. You can create this token on Github.com at [https://github.com/settings/tokens/new](https://github.com/settings/tokens/new). The OAuth token can be used to boost the Github API rate-limit from 60 to 5000 (non-cached) requests per hour. This token just needs ['read-only access to public information'](http://developer.github.com/v3/oauth/#scopes) so no additional OAuth scopes are necessary. Note: keep in mind the `.typingsrc` file is *not* secured. Don't use a token with additional scope unless you know what you are doing. |
| registryURL        | Override the registry URL. (Default: `"https://api.typings.org"`.)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       |
| defaultSource      | Override the default installation source (E.g. when doing `typings install debug`) default: `npm`). Allowed options: `file`, `npm`, `github`, `bitbucket`, `bower`, `http`, or `https`                                                                                                                                                                                                                                                                                                                                                                                                                   |

## What Are Global Dependencies?

Global dependencies are type definitions that are global or otherwise provide information about the environment. Some examples of "environment" dependencies are Node.js, Browserify, `window` and even `Array.prototype.map`. These are globals that exist at runtime, you do not "require" them. If your package exposes a module and/or global dependencies, it's recommended you expose a way to install the global definitions (explain installation in the docs, for instance).

## Should I Use The `typings` Field In `package.json`?

If you're a module author, absolutely!

However, it can't be used properly if any of your exposed API surface (the `.d.ts` files) have dependencies that come from `typings`.
In that case, you can rely on `typings.json` to include typings for your dependencies so that your user can use `typings install npm:<your package>` to install your typings.

Also, if you are using the `files` field in `package.json` to control which files will be available, remember to include `typings.json`.

## Where Do The Type Definitions Install?

Typings are compiled and written into the `typings/` directory alongside `typings.json` (by default). The structure looks like this:

```sh
typings/{globals,modules}/<dependency>/index.d.ts
typings/index.d.ts
```

To change the output directory or specify a different output, you can use the `resolution` feature in `typings.json`:

```json
{
  "resolution": "src/typings"
}
```

Or to get both "main" and "browser" typings, a la Typings `0.x`:

```json
{
  "resolution": {
    "main": "typings/main",
    "browser": "typings/browser"
  }
}
```

## Types of Typings

There are two major types of type definitions - external modules and global definitions. Typings can install both. It supports modules by default, and also supports global definitions using the `--global` flag.

A module definition is considered "external" if it has an `import` or `export` declaration at the top-level. Everything else can be considered "global". In the past, without tooling such as Typings, we've relied on writing global definitions to define modules using the `declare module '...'` syntax. With Typings, it will end up the same (wrapped in `declare module '...'`), but the Typings tool is doing the wrapping so it can manage the dependency tree without namespace conflicts _and_ ensure nothing is leaking into the global namespace (unless it's `--global`, that's confirming to Typings you're OK with it polluting the global namespace).

## About `npm:<pkg>`

_Related to the [`typings` field in `package.json`](#should-i-use-the-typings-field-in-packagejson)._

`tsc` will automatically read typings for npm modules. Why do we still need `typings install npm:<pkg>`?

This is because `tsc` can only resolve npm dependencies if they are also typed. To get around this limitation, module authors can publish a `typings.json` with their module to specify the typings needed. When you consume the module, using `typings install npm:<pkg>` to install the typings from `node_modules/` and resolve dependencies in `package.json` and `typings.json`.
