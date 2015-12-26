#!/usr/bin/env node

import minimist = require('minimist')
import extend = require('xtend')
import chalk = require('chalk')
import { install, installDependency } from '../typings'
import { loader, inquire } from '../utils/cli'
import { PROJECT_NAME } from '../utils/config'
import { VALID_SOURCES, isRegistryPath, parseRegistryPath, search, getVersions } from '../lib/registry'
import { ReferenceMap } from '../lib/compile'
import { DependencyTree } from '../interfaces/main'
import { archifyDependencyTree, handleError } from '../utils/cli'
import TypingsError from '../lib/error'

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
${PROJECT_NAME} install <pkg>[@<version>] [ --source [${Object.keys(VALID_SOURCES).join(' | ')}] ]
${PROJECT_NAME} install file:<path>
${PROJECT_NAME} install github:<github username>/<github project>[/<path>][#<commit>]
${PROJECT_NAME} install bitbucket:<bitbucket username>/<bitbucket project>[/<path>][#<commit>]
${PROJECT_NAME} install <http:// url>

Aliases: i, in
Options: [--name] [--save|--save-dev] [--ambient] [--production]
`)

  process.exit(0)
}

interface PrintOutput {
  tree: DependencyTree
  references?: ReferenceMap
  missing?: ReferenceMap
}

/**
 * Print the result to the user.
 */
function printResult (output: PrintOutput, options?: { name: string }) {
  if (output.references) {
    const references = Object.keys(output.references)

    if (references.length) {
      console.log(`References ${chalk.bold(`(not installed)`)}:`)

      for (const reference of references) {
        const info = output.references[reference]

        console.log(`  ${reference} ${chalk.gray(`(from ${info.map(x => x.name).join(', ')})`)}`)
      }

      console.log('')
    }
  }

  if (output.missing) {
    const missings = Object.keys(output.missing)

    if (missings.length) {
      console.log(`Possible ambient modules ${chalk.bold(`(not installed)`)}:`)

      for (const missing of missings) {
        const info = output.missing[missing]

        console.log(`  ${missing} ${chalk.gray(`(from ${info.map(x => x.name).join(', ')})`)}`)
      }

      console.log('')
    }
  }

  console.log(archifyDependencyTree(output.tree, options))
}

/**
 * Install using CLI arguments.
 */
function installer (args: Args & minimist.ParsedArgs) {
  const cwd = process.cwd()
  const { verbose, save, saveDev, name, ambient, source, production } = args
  const options = { save, saveDev, name, ambient, cwd, production }

  if (!args._.length) {
    return loader(install(options), args)
      .then(output => printResult(output))
  }

  const dependency = args._[0]

  if (!isRegistryPath(dependency)) {
    return loader(installDependency(dependency, options), args)
      .then(output => printResult(output, { name }))
  }

  const { name: dependencyName, version } = parseRegistryPath(dependency)

  // Install a dependency from a specific source.
  function installFrom (source: string) {
    const saveName = name || dependencyName
    const sourceName = VALID_SOURCES[source]

    return getVersions(source, dependencyName, version)
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
        const installOptions = extend(options, { name: saveName })
        const installation = installDependency(version.location, installOptions)

        console.log(`Installing ${dependencyName}@${version.version} for ${sourceName}...`)

        // Log extra info when the installation name is different to the registry.
        if (name != null && name !== saveName) {
          console.log(`Writing dependency as "${saveName}"...`)
        }

        console.log('')

        return loader(installation, args)
      })
      .then(output => printResult(output, { name: saveName }))
  }

  // User provided a source.
  if (args.source) {
    return installFrom(args.source)
  }

  // Search all sources for the project name.
  return loader(search({ name: dependencyName }), { verbose })
    .then(function (result) {
      const { results } = result

      if (results.length === 0) {
        return Promise.reject(new TypingsError(
          `Unable to find "${dependencyName}" in the registry. If you can contribute ` +
          `this typing, please help us out: https://github.com/typings/registry`
        ))
      }

      if (results.length === 1) {
        const item = results[0]
        const source = VALID_SOURCES[item.source]

        return inquire([{
          type: 'confirm',
          name: 'ok',
          message: `Found typings for ${dependencyName} in ${source}. Ok?`
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
        message: `Found typings for ${dependencyName} in multiple registries`,
        choices: results.map(result => {
          return {
            name: VALID_SOURCES[result.source],
            value: result.source
          }
        })
      }])
        .then((answers: any) => installFrom(answers.source))
    })
    .catch(err => handleError(err, { verbose }))
}

// Execute the installer, which has many different code flows.
installer(args)
