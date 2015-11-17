#!/usr/bin/env node

import minimist = require('minimist')
import extend = require('xtend')
import { install, installDependency } from '../typings'
import { loader, inquire } from '../utils/cli'
import { PROJECT_NAME } from '../utils/config'
import { VALID_SOURCES, read, isRegistryPath, parseRegistryPath } from '../lib/registry'
import { archifyDependencyTree } from '../utils/cli'

interface Args {
  save: boolean
  saveDev: boolean
  saveAmbient: boolean
  ambient: boolean
  name?: string
  verbose: boolean
  help: boolean
  source?: string
}

const args = minimist<Args>(process.argv.slice(2), {
  boolean: ['save', 'saveAmbient', 'saveDev', 'ambient', 'verbose', 'help'],
  string: ['name', 'source'],
  alias: {
    save: ['S'],
    saveAmbient: ['A', 'save-ambient'],
    saveDev: ['save-dev', 'D'],
    name: ['n'],
    ambient: ['a'],
    verbose: ['v'],
    help: ['h'],
    source: ['s']
  }
})

if (args.help) {
  console.log(`
${PROJECT_NAME} install (with no arguments, in package directory)
${PROJECT_NAME} install <pkg>[@<version>] --source [${VALID_SOURCES.join(' | ')}]
${PROJECT_NAME} install file:<path>
${PROJECT_NAME} install github:<github username>/<github project>[/<path>][#<commit>]
${PROJECT_NAME} install bitbucket:<bitbucket username>/<bitbucket project>[/<path>][#<commit>]
${PROJECT_NAME} install <http:// url>

Aliases: i, in
Options: [--save|--save-dev|--save-ambient] [--ambient]
`)

  process.exit(0)
}

/**
 * Install using CLI arguments.
 */
function installer (args: Args & minimist.ParsedArgs) {
  const options = extend(args, { cwd: process.cwd() })

  if (!args._.length) {
    return loader(install(options), options)
  }

  const dependency = args._[0]
  const source = args.source || 'npm'

  if (!isRegistryPath(dependency)) {
    return loader(installDependency(dependency, options), options)
  }

  const { name, version } = parseRegistryPath(dependency)

  return loader(read({ source, name, version }), options)
    .then(function (locations) {
      if (locations.length === 1) {
        return locations[0]
      }

      // Ask the user what they want to install.
      return inquire([{
        name: 'location',
        type: 'list',
        message: 'Select the type definition to install',
        choices: locations
      }])
        .then((answers: any) => answers.location)
    })
    .then(function (location) {
      const installation = installDependency(location, extend({ name }, options))

      return loader(installation, options)
    })
}

installer(args)
  .then(function (tree) {
    console.log(archifyDependencyTree(tree))
  })
