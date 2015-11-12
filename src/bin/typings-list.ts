#!/usr/bin/env node

import minimist = require('minimist')
import archy = require('archy')
import extend = require('xtend')
import { loader } from '../utils/cli'
import { PROJECT_NAME } from '../utils/config'
import { DependencyTree } from '../interfaces/main'
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
    const archyTree = dependencyTreeToArchy(tree, options)

    console.log(archy(archyTree))
  })

/**
 * Convert a dependency tree for "archy" to render.
 */
function dependencyTreeToArchy (tree: DependencyTree, options: ArgvOptions) {
  const result: archy.Tree = {
    label: tree.name,
    nodes: []
  }

  function traverse (result: archy.Tree, tree: DependencyTree) {
    const { nodes } = result

    if (options.ambient) {
      for (const name of Object.keys(tree.ambientDependencies)) {
        nodes.push(traverse(
          {
            label: name,
            nodes: []
          },
          tree.ambientDependencies[name]
        ))
      }
    } else {
      for (const name of Object.keys(tree.devDependencies)) {
        nodes.push(traverse(
          {
            label: name,
            nodes: []
          },
          tree.devDependencies[name]
        ))
      }

      for (const name of Object.keys(tree.dependencies)) {
        nodes.push(traverse(
          {
            label: name,
            nodes: []
          },
          tree.dependencies[name]
        ))
      }
    }

    return result
  }

  return traverse(result, tree)
}
