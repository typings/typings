import logUpdate = require('log-update')
import spinner = require('elegant-spinner')
import chalk = require('chalk')
import Promise = require('any-promise')
import promiseFinally from 'promise-finally'
import inquirer = require('inquirer')
import archy = require('archy')
import * as os from 'os'
import { BaseError } from 'make-error-cause'
import { DependencyTree } from '../interfaces/main'
import { PROJECT_NAME, ISSUES_HOMEPAGE } from '../utils/config'

const pkg = require('../../package.json')

/**
 * Options for the execution.
 */
export interface PrintOptions {
  verbose: boolean
}

/**
 * Wrap async execution with a spinner.
 */
export function loader <T> (promise: T | Promise<T>, options: PrintOptions): Promise<T> {
  let end: () => void = () => undefined

  if ((process.stdout as any).isTTY) {
    const frame = spinner()
    const update = () => logUpdate.stderr(frame())
    const interval = setInterval(update, 50)

    end = () => {
      clearInterval(interval)
      logUpdate.stderr.clear()
      logUpdate.stderr.done()
    }
  }

  return promiseFinally(Promise.resolve(promise), end)
    .catch(err => handleError(err, options))
}

/**
 * Log an error message.
 */
export function logError (message: string, prefix?: string) {
  let result = ''

  for (const line of message.split(/\r?\n/g)) {
    result += `${chalk.bgBlack.white(PROJECT_NAME)} ${chalk.bgBlack.red('ERR!')} ${prefix ? chalk.magenta(`${prefix} `) : ''}${line}\n`
  }

  return result
}

/**
 * Final error handling for the CLI.
 */
export function handleError (error: BaseError, options: PrintOptions): any {
  let message = ''
  let cause = error

  message += logError(error.message, 'message')

  while (cause = cause.cause as any) {
    message += logError(cause.message, 'caused by')
  }

  if (options.verbose && error.stack) {
    message += '\n'
    message += logError(error.stack, 'stack')
  }

  message += '\n'
  message += logError(process.cwd(), 'cwd')
  message += logError(`${os.type()} ${os.release()}`, 'system')
  message += logError(process.argv.map(JSON.stringify).join(' '), 'command')
  message += logError(process.version, 'node -v')
  message += logError(pkg.version, `${PROJECT_NAME} -v`)

  if ((error as any).code) {
    message += logError((error as any).code, 'code')
  }

  message += '\n'
  message += logError('If you need help, you may report this error at:')
  message += logError(`  <${ISSUES_HOMEPAGE}>`)

  console.error(message)
  process.exit(1)
}

/**
 * Run a CLI query using inquirer.
 */
export function inquire (questions: inquirer.Questions) {
  return new Promise(resolve => {
    inquirer.prompt(questions, resolve)
  })
}

/**
 * Options for archifying the dependency tree.
 */
export interface ArchifyOptions {
  name?: string
}

/**
 * Convert a dependency tree for "archy" to render.
 */
export function archifyDependencyTree (tree: DependencyTree, options: ArchifyOptions = {}) {
  const result: archy.Tree = {
    label: options.name,
    nodes: []
  }

  function traverse (result: archy.Tree, tree: DependencyTree) {
    const { nodes } = result

    for (const name of Object.keys(tree.dependencies).sort()) {
      nodes.push(traverse(
        {
          label: name,
          nodes: []
        },
        tree.dependencies[name]
      ))
    }

    for (const name of Object.keys(tree.devDependencies).sort()) {
      nodes.push(traverse(
        {
          label: `${name} ${chalk.gray('(dev)')}`,
          nodes: []
        },
        tree.devDependencies[name]
      ))
    }

    for (const name of Object.keys(tree.ambientDependencies).sort()) {
      nodes.push(traverse(
        {
          label: `${name} ${chalk.gray('(ambient)')}`,
          nodes: []
        },
        tree.ambientDependencies[name]
      ))
    }

    for (const name of Object.keys(tree.ambientDevDependencies).sort()) {
      nodes.push(traverse(
        {
          label: `${name} ${chalk.gray('(ambient dev)')}`,
          nodes: []
        },
        tree.ambientDevDependencies[name]
      ))
    }

    return result
  }

  const archyTree = traverse(result, tree)

  // Print "no dependencies" on empty tree.
  if (archyTree.nodes.length === 0) {
    archyTree.nodes.push(chalk.gray('(No dependencies)'))
  }

  return archy(archyTree)
}
