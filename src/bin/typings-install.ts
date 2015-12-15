#!/usr/bin/env node

import minimist = require('minimist')
import extend = require('xtend')
import { install, installDependency } from '../typings'
import { loader, inquire } from '../utils/cli'
import { PROJECT_NAME } from '../utils/config'
import { VALID_SOURCES, isRegistryPath, parseRegistryPath, search, getVersions } from '../lib/registry'
import { archifyDependencyTree } from '../utils/cli'

interface Args {
  save: boolean
  saveDev: boolean
  ambient: boolean
  production: boolean
  name?: string
  verbose: boolean
  help: boolean
  source?: string
}

const args = minimist<Args>(process.argv.slice(2), {
  boolean: ['save', 'saveDev', 'ambient', 'verbose', 'help', 'production'],
  string: ['name', 'source'],
  alias: {
    save: ['S'],
    saveDev: ['save-dev', 'D'],
    name: ['n'],
    ambient: ['A'],
    verbose: ['v'],
    help: ['h'],
    source: ['s'],
    production: ['p']
  }
})

if (args.help) {
  console.log(`
${PROJECT_NAME} install (with no arguments, in package directory)
${PROJECT_NAME} install <pkg>[@<version>] [ --source [${VALID_SOURCES.join(' | ')}] ]
${PROJECT_NAME} install file:<path>
${PROJECT_NAME} install github:<github username>/<github project>[/<path>][#<commit>]
${PROJECT_NAME} install bitbucket:<bitbucket username>/<bitbucket project>[/<path>][#<commit>]
${PROJECT_NAME} install <http:// url>

Aliases: i, in
Options: [--name] [--save|--save-dev] [--ambient] [--production]
`)

  process.exit(0)
}

/**
 * Install using CLI arguments.
 */
function installer (args: Args & minimist.ParsedArgs) {
  const options = extend(args, { cwd: process.cwd() })

  if (!args._.length) {
    return loader(install(options), args)
      .then(function (tree) {
        console.log(archifyDependencyTree(tree, { ambient: true, dev: true }))
      })
  }

  const dependency = args._[0]

  if (!isRegistryPath(dependency)) {
    return loader(installDependency(dependency, options), args)
      .then(function (tree) {
        console.log(archifyDependencyTree(tree, { name: options.name }))
      })
  }

  const { name, version } = parseRegistryPath(dependency)

  // Install a dependency from a specific source.
  function installFrom (source: string) {
    const installationName = args.name || name

    return getVersions(source, name, version)
      .then(function (project) {
        const { versions } = project

        if (versions.length === 1) {
          return versions[0]
        }

        return inquire([{
          name: 'version',
          type: 'list',
          message: 'Select a version',
          choices: versions.map((x, i) => {
            const { version, compiler } = x

            return {
              name: version + (compiler ? ` (TypeScript >= ${compiler})` : ''),
              value: String(i)
            }
          })
        }])
          .then((answers: any) => versions[answers.version])
      })
      .then(function (version) {
        const installation = installDependency(version.location, extend(options, { name: installationName }))

        console.log(`Installing ${name}@${version.version} from ${source}...`)

        return loader(installation, args)
      })
      .then(function (tree) {
        console.log(archifyDependencyTree(tree, { name: installationName }))
      })
  }

  // User provided a source.
  if (args.source) {
    return installFrom(args.source)
  }

  // Search all sources for the project name.
  return loader(search({ name }), args)
    .then(function (result) {
      const { results } = result

      if (results.length === 0) {
        return Promise.reject(new Error(`Unable to find "${name}" in the registry`))
      }

      if (results.length === 1) {
        const item = results[0]

        return inquire([{
          type: 'confirm',
          name: 'ok',
          message: `Found "${name}" in the registry from "${item.source}". Ok?`
        }])
          .then(function (answers: any) {
            if (answers.ok) {
              return installFrom(item.source)
            }
          })
      }

      return inquire([{
        type: 'list',
        name: 'source',
        message: `Found "${name}" in the registry from multiple sources`,
        choices: results.map(x => x.source)
      }])
        .then((answers: any) => installFrom(answers.source))
    })
}

installer(args)
