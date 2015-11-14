#!/usr/bin/env node

import minimist = require('minimist')
import extend = require('xtend')
import { loader, archifyDependencyTree } from '../utils/cli'
import { PROJECT_NAME } from '../utils/config'
import { resolveTypeDependencies } from '../lib/dependencies'

interface ArgvOptions {
  verbose: boolean
  help: boolean
  ambient: boolean
}

const args = minimist<ArgvOptions>(process.argv.slice(2), {
  boolean: ['verbose', 'help', 'ambient'],
  alias: {
    verbose: ['v'],
    ambient: ['a'],
    help: ['h']
  }
})

if (args.help) {
  console.log(`
${PROJECT_NAME} ls [--ambient]

Aliases: la, ll, list
`)

  process.exit(0)
}

const cwd = process.cwd()
const options = extend(args, { cwd })

loader(resolveTypeDependencies({ cwd, ambient: true, dev: true }), options)
  .then(function (tree) {
    console.log(archifyDependencyTree(tree, options))
  })
