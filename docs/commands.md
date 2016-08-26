# Commands

An overview of available commands for `typings`.

## Install

**Please note:** `npm` and `bower` resolve using their respective algorithms over the local filesystem. They will need to be installed before running `typings install`. The other schemes (`http`, `https`, `github`, `bitbucket`) resolve over HTTP(s). Finally, file is a location in the local filesystem relative to the `typings.json` directory.

Write a dependency to the `typings/` directory, optionally persisting it in `typings.json`.

```
typings install (with no arguments, in package directory)
typings install [<name>=]<location>

  <name>      Module name of the installed definition
  <location>  The location to read from (described below)

Valid Locations:
  [<source>~]<pkg>[@<version>][#<tag>]
  file:<path>
  github:<org>/<repo>[/<path>][#<commitish>]
  bitbucket:<org>/<repo>[/<path>][#<commitish>]
  npm:<pkg>[/<path>]
  bower:<pkg>[/<path>]
  http(s)://<host>/<path>

  <source>    The registry mirror: "npm", "bower", "env", "global", "lib" or "dt"
              When not specified, `defaultSource` in `.typingsrc` will be used.
  <path>      Path to a `.d.ts` file or `typings.json`
  <host>      A domain name (with optional port)
  <version>   A semver range (E.g. ">=4.0")
  <tag>       The specific tag of a registry entry
  <commitish> A git commit, tag or branch

Options:
  [--save|-S]       Persist to "dependencies"
  [--save-dev|-D]   Persist to "devDependencies"
  [--save-peer|-P]  Persist to "peerDependencies"
  [--global|-G]     Install and persist as a global definition
    [-SG]           Persist to "globalDependencies"
    [-DG]           Persist to "globalDevDependencies"
  [--production]    Install only production dependencies (omits dev dependencies)

Aliases: i, in
```

## Uninstall

Remove a dependency from the typings/ directory, and optionally remove from `typings.json`.

```
typings uninstall <name> [--save|--save-dev|--save-peer] [--global]

Options:
  [--save|-S]       Remove from "dependencies"
  [--save-dev|-D]   Remove from "devDependencies"
  [--save-peer|-P]  Remove from "peerDependencies"
  [--global|-G]     Remove from the global version of dependencies
    [-SG]           Remove from "globalDependencies"
    [-DG]           Remove from "globalDevDependencies"

Aliases: r, rm, remove, un
```

## Init

Initialize a new typings.json file. If you're currently using TSD, you can use `--upgrade` to convert `tsd.json` to `typings.json`.

```
typings init

Options:
  [--upgrade]    Upgrade `tsd.json` to `typings.json`
```

## List

Print the typings dependency tree.

```
typings list

Options:
  [--production] List only production dependencies (omit dev dependencies)

Aliases: la, ll, ls
```

## Bundle

Bundle the current project types into a single global module.

```
typings bundle --out <filepath>
Options:
  [--out|-o] <filepath>  The bundled output file path
  [--global|-G]          Bundle as a global definition
```

## Search

Search the Typings Registry for type defintions.

```
typings search [query]

Options:
  [--name] <name>     Search for definitions by exact name (E.g. only "react")
  [--source] <source> The registry mirror (E.g. "npm", "bower", "env", "global", "dt", ...)
  [--offset] <x>      Skip first "x" results (default: 0)
  [--limit] <x>       Limit to "x" results (default: 20, max: 100)
  [--order] <order>   Direction to sort results (default: "asc", enum: "asc" or "desc")
  [--sort] <column>   Order results by a column (E.g. "versions", "name", ...)
```

## Open

Get the full URL from a Typings location

```
typings open <location>

  <location>  A known Typings location with scheme (see typings install -h)
```

## View

Get information for a package on the Typings Registry

```
typings view <pkg>

  <pkg>  A registry expression like `[<source>~]<pkg>`

Options:
  [--versions]  List all package versions

Aliases: info
```

## Prune

Prune extraneous typings from directory

```
typings prune

Options:
  [--production] Also prune non-production dependencies
```
