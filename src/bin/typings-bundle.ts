#!/usr/bin/env node

import minimist = require('minimist')
import extend = require('xtend')
import { resolve } from 'path'
import { bundle } from '../typings'
import { loader } from '../utils/cli'
import { writeFile } from '../utils/fs'
import { PROJECT_NAME } from '../utils/config'

interface Args {
  out: string
  name: string
  source: string
  browser: boolean
  verbose: boolean
  help: boolean
}

const args = minimist<Args>(process.argv.slice(2), {
  boolean: ['verbose', 'browser', 'name', 'help'],
  string: ['out', 'source', 'name'],
  alias: {
    source: ['s'],
    name: ['n'],
    browser: ['b'],
    verbose: ['v'],
    out: ['o'],
    help: ['h']
  }
})

if (args.help) {
  console.log(`
${PROJECT_NAME} bundle --name [string]

Options: [--browser] [--out] [--source]
`)

  process.exit(0)
}

const cwd = process.cwd()
const { verbose } = args
const options = extend({ source: cwd }, args)

loader(bundle(options), { verbose })
  .then(function (output) {
    const contents = options.browser ? output.browser : output.main

    if (options.out) {
      return loader(writeFile(resolve(cwd, options.out), contents), options)
    }

    process.stdout.write(contents)
  })
