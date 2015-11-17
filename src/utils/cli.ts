import logUpdate = require('log-update')
import spinner = require('elegant-spinner')
import chalk = require('chalk')
import Promise = require('native-or-bluebird')
import promiseFinally from 'promise-finally'
import inquirer = require('inquirer')
import archy = require('archy')
import { DependencyTree } from '../interfaces/main'

/**
 * Options for the execution.
 */
export interface ExecutionOptions {
  verbose: boolean
}

/**
 * Wrap async execution with a spinner.
 */
export function loader <T> (promise: T | Promise<T>, options?: ExecutionOptions): Promise<T> {
  let end: () => void = () => undefined

  if ((process.stdout as any).isTTY) {
    const frame = spinner()
    const update = () => logUpdate.stderr(frame())
    const interval = setInterval(update, 50)

    end = () => {
      clearInterval(interval)
      logUpdate.stderr.clear()
    }
  }

  return promiseFinally(Promise.resolve(promise), end)
    .catch((error: Error) => {
      console.log(chalk.red(`${error.name}: ${error.message}`))

      if (options.verbose && 'stack' in error) {
        console.log((error as any).stack)
      }

      process.exit(1)

      // TODO(blakeembrey): Fix type inference, we'll never reach here.
      return Promise.reject(error)
    })
}

export function inquire (questions: inquirer.Questions) {
  return new Promise(resolve => {
    inquirer.prompt(questions, resolve)
  })
}

/**
 * Convert a dependency tree for "archy" to render.
 */
export function archifyDependencyTree (tree: DependencyTree, options: { ambient?: boolean } = {}) {
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

  const archyTree = traverse(result, tree)

  // Print "no dependencies" on empty tree.
  if (archyTree.nodes.length === 0) {
    archyTree.nodes.push(chalk.cyan('No dependencies'))
  }

  return archy(archyTree)
}
