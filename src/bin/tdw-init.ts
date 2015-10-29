#!/usr/bin/env node

import minimist = require('minimist')
import extend = require('xtend')
import { init } from '../tdw'
import { wrapExecution } from '../utils/cli'

interface ArgvOptions {
  upgrade: boolean
  verbose: boolean
}

const args = minimist<ArgvOptions>(process.argv.slice(2), {
  boolean: ['upgrade', 'verbose'],
  alias: {
    upgrade: ['u'],
    verbose: ['v']
  }
})

const options = extend(args, { cwd: process.cwd() })

wrapExecution(init(options), options)
