#!/usr/bin/env node

import minimist = require('minimist')
import extend = require('xtend')
import { loader, archifyDependencyTree } from '../utils/cli'
import { PROJECT_NAME } from '../utils/config'
import { resolveTypeDependencies } from '../lib/dependencies'

interface Args {
  verbose: boolean
  help: boolean
  production: boolean
}

const args = minimist<Args>(process.argv.slice(2), {
  boolean: ['verbose', 'help', 'production'],
  alias: {
    verbose: ['v'],
    production: ['p'],
    help: ['h']
  }
})

if (args.help) {
  console.log(`
${PROJECT_NAME} ls [--ambient] [--production]

Aliases: la, ll, list
`)

  process.exit(0)
}

const cwd = process.cwd()
const { verbose } = args
const dev = !args.production

loader(resolveTypeDependencies({ cwd, ambient: true, dev }), { verbose })
  .then(function (tree) {
    console.log(archifyDependencyTree(tree))
  })
