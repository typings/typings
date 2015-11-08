#!/usr/bin/env node

import minimist = require('minimist')
import extend = require('xtend')
import { init } from '../typings'
import { wrapExecution } from '../utils/cli'
import { PROJECT_NAME } from '../utils/config'

interface ArgvOptions {
  verbose: boolean
  help: boolean
}

const args = minimist<ArgvOptions>(process.argv.slice(2), {
  boolean: ['verbose', 'help'],
  alias: {
    verbose: ['v'],
    help: ['h']
  }
})

if (args.help) {
  console.log(`
${PROJECT_NAME} init
`)

  process.exit(0)
}

const options = extend(args, { cwd: process.cwd() })

wrapExecution(init(options), options)
