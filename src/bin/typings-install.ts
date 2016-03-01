#!/usr/bin/env node

import minimist = require('minimist')
import extend = require('xtend')
import chalk = require('chalk')
import Promise = require('any-promise')
import listify = require('listify')
import { install, installDependency, InstallDependencyOptions } from '../typings'
import { loader, inquire, handleError, archifyDependencyTree } from '../utils/cli'
import { PROJECT_NAME } from '../utils/config'
import { inferDependencyName } from '../utils/parse'
import { VALID_SOURCES, isRegistryPath, parseRegistryPath, search, getVersions } from '../lib/registry'
import { ReferenceMap } from '../lib/compile'
import { DependencyTree } from '../interfaces/main'
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
${PROJECT_NAME} install npm:<package>
${PROJECT_NAME} install bower:<package>
${PROJECT_NAME} install <https?:// url>

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
function printResult (output: PrintOutput, options?: { name: string, save?: boolean, saveDev?: boolean, ambient?: boolean }) {
  if (output.references) {
    const references = Object.keys(output.references)

    if (references.length) {
      console.log(chalk.bold(`References (stripped):`))
      const strippedReferenceNames = references.map(reference => listify(output.references[reference].map(x => x.name)));
      strippedReferenceNames.forEach(rn => console.log(`  ${chalk.gray(`(from ${rn})`)}`))
      console.log('')
      
      if (options.ambient) {
        console.log(chalk.bold('As you\'re installing ambient references you may want to install the stripped references as well. You can do that by executing the following commands:'))
        const flags = [].concat(
            options.save ? ['save'] : [],
            options.saveDev ? ['saveDev'] : [],
            'ambient'
        )
        strippedReferences.forEach(r => console.log(`  typings install '${r.reference}'${ flags }`))
        console.log('')
      }
    }
  }

  if (output.missing) {
    const missings = Object.keys(output.missing)

    if (missings.length) {
      console.log(chalk.bold('Missing dependencies:'))

      for (const missing of missings) {
        const info = output.missing[missing]

        console.log(`  ${missing} ${chalk.gray(`(from ${listify(info.map(x => x.name))})`)}`)
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

  function installLocation (location: string, options: InstallDependencyOptions) {
    function handle (options: InstallDependencyOptions) {
      return loader(installDependency(location, options), args)
        .then(output => {
          printResult(output, options)
        })
    }

    if (typeof options.name === 'string') {
      return handle(options)
    }

    return inquire([{
      name: 'name',
      type: 'input',
      message: 'What is the dependency name?',
      default: inferDependencyName(location)
    }])
      .then((answers: any) => handle(extend(options, { name: answers.name})))
  }

  const location = args._[0]

  if (!isRegistryPath(location)) {
    return installLocation(location, options)
  }

  const { name: dependencyName, version } = parseRegistryPath(location)

  // Install a dependency from a specific source.
  function installFrom (source: string) {
    const saveName = name || dependencyName
    const sourceName = VALID_SOURCES[source]

    return getVersions(source, dependencyName, version)
      .then(function (project) {
        const { versions } = project
        const [version] = versions

        console.log(`Installing ${dependencyName}@~${version.version} (${sourceName})...`)

        // Log extra info when the installation name is different to the registry.
        if (name != null && name !== saveName) {
          console.log(`Writing dependency as "${saveName}"...`)
        }

        console.log('')

        return installLocation(version.location, extend(options, { name: saveName }))
      })
      .catch(err => handleError(err, { verbose }))
  }

  // User provided a source.
  if (args.source) {
    return installFrom(args.source)
  }

  // Search all sources for the project name.
  return loader(search({ name: dependencyName, ambient }), { verbose })
    .then(function (result) {
      const { results } = result

      if (results.length === 0) {
        const prompt = !ambient ? 'Did you want to install an ambient typing? Try using "--ambient". ' : ''

        return Promise.reject(new TypingsError(
          `Unable to find "${dependencyName}" in the registry. ` + prompt +
          `If you can contribute this type definition, please help us: ` +
          `https://github.com/typings/registry`
        ))
      }

      if (results.length === 1) {
        const item = results[0]
        const source = VALID_SOURCES[item.source]

        return inquire([{
          type: 'confirm',
          name: 'ok',
          message: `Found ${dependencyName} typings for ${source}. Continue?`
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
        message: `Found ${dependencyName} typings for multiple registries`,
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
