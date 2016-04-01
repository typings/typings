import chalk = require('chalk')
import Promise = require('any-promise')
import archy = require('archy')
import * as os from 'os'
import { DependencyTree } from 'typings-core'

const pkg = require('../../package.json')

/**
 * Options for the execution.
 */
export interface PrintOptions {
  verbose: boolean
}

/**
 * Log a trivial string, without bells or whistles.
 */
export function log (message: string) {
  console.error(message)
}

/**
 * Format a message line.
 */
function formatLine (color: Function, type: string, line: string, prefix?: string) {
  return `${chalk.bgBlack.white('typings')} ${color(type)} ${prefix ? chalk.magenta(`${prefix} `) : ''}${line}`
}

/**
 * Log an info message.
 */
export function logInfo (message: string, prefix?: string) {
  const output = message.split(/\r?\n/g).map(line => {
    return formatLine(chalk.bgBlack.cyan, 'INFO', line, prefix)
  }).join('\n')

  log(output)
}

/**
 * Log a warning message.
 */
export function logWarning (message: string, prefix?: string) {
  const output = message.split(/\r?\n/g).map(line => {
    return formatLine(chalk.bgYellow.black, 'WARN', line, prefix)
  }).join('\n')

  log(output)
}

/**
 * Log an error message.
 */
export function logError (message: string, prefix?: string) {
  const output = message.split(/\r?\n/g).map(line => {
    return formatLine(chalk.bgBlack.red, 'ERR!', line, prefix)
  }).join('\n')

  log(output)
}

/**
 * Handle a CLI function handler.
 */
export function handle (promise: any, options: PrintOptions) {
  return Promise.resolve(promise).catch(err => handleError(err, options))
}

/**
 * Final error handling for the CLI.
 */
export function handleError (error: Error, options: PrintOptions): any {
  let cause = error

  logError(error.message, 'message')

  while (cause = (cause as any).cause) {
    logError(cause.message, 'caused by')
  }

  if (options.verbose && error.stack) {
    log('')
    logError(error.stack, 'stack')
  }

  log('')
  logError(process.cwd(), 'cwd')
  logError(`${os.type()} ${os.release()}`, 'system')
  logError(process.argv.map(JSON.stringify).join(' '), 'command')
  logError(process.version, 'node -v')
  logError(pkg.version, `typings -v`)

  if ((error as any).code) {
    logError((error as any).code, 'code')
  }

  log('')
  logError('If you need help, you may report this error at:')
  logError(`  <https://github.com/typings/typings/issues>`)

  process.exit(1)
}

/**
 * Options for archifying the dependency tree.
 */
export interface ArchifyOptions {
  name?: string
  tree: DependencyTree
}

/**
 * Convert a dependency tree for "archy" to render.
 */
export function archifyDependencyTree (options: ArchifyOptions) {
  const result: archy.Tree = {
    label: options.name,
    nodes: []
  }

  function traverse (result: archy.Tree, tree: DependencyTree) {
    const { nodes } = result

    for (const name of Object.keys(tree.dependencies).sort()) {
      const node = tree.dependencies[name]
      nodes.push(traverse(
        {
          label: `${name}@${node.version}`,
          nodes: []
        },
        node
      ))
    }

    for (const name of Object.keys(tree.devDependencies).sort()) {
      const node = tree.devDependencies[name]
      nodes.push(traverse(
        {
          label: `${name}@${node.version} ${chalk.gray('(dev)')}`,
          nodes: []
        },
        node
      ))
    }

    for (const name of Object.keys(tree.ambientDependencies).sort()) {
      const node = tree.ambientDependencies[name]
      nodes.push(traverse(
        {
          label: `${name}@${node.version} ${chalk.gray('(ambient)')}`,
          nodes: []
        },
        node
      ))
    }

    for (const name of Object.keys(tree.ambientDevDependencies).sort()) {
      const node = tree.ambientDevDependencies[name]
      nodes.push(traverse(
        {
          label: `${name}@${node.version} ${chalk.gray('(ambient dev)')}`,
          nodes: []
        },
        node
      ))
    }

    return result
  }

  const archyTree = traverse(result, options.tree)

  // Print "no dependencies" on empty tree.
  if (archyTree.nodes.length === 0) {
    archyTree.nodes.push(chalk.gray('(No dependencies)'))
  }

  return archy(archyTree)
}
