import chalk = require('chalk')
import Promise = require('any-promise')
import archy = require('archy')
import * as os from 'os'
import { DependencyTree, DependencyBranch } from 'typings-core'

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
  let cause = (error as any).cause

  logError(error.message, 'message')

  while (cause) {
    logError(cause.message, 'caused by')

    cause = (cause as any).cause
  }

  if (options.verbose && error.stack) {
    log('')
    logError(error.stack, 'stack')
  }

  log('')
  logError(process.cwd(), 'cwd')
  logError(`${os.type()} ${os.release()}`, 'system')
  logError(process.argv.map(arg => JSON.stringify(arg)).join(' '), 'command')
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
  unicode?: boolean
}

/**
 * Make the dependency into the CLI name.
 */
function toDependencyName (name: string, node: DependencyTree, suffix?: string) {
  const fullname = node.version ? `${name}@${node.version}` : name

  return suffix ? `${fullname} ${suffix}` : fullname
}

/**
 * Convert a dependency tree for "archy" to render.
 */
export function archifyDependencyTree (options: ArchifyOptions) {
  const result: archy.Tree = {
    label: options.name ? toDependencyName(options.name, options.tree) : '',
    nodes: []
  }

  // Append a list of dependency to the node list.
  function children (nodes: (string | archy.Tree)[], dependencies: DependencyBranch, suffix?: string) {
    for (const name of Object.keys(dependencies).sort()) {
      const tree = dependencies[name]

      nodes.push(traverse(
        {
          label: toDependencyName(name, tree, suffix),
          nodes: []
        },
        tree
      ))
    }
  }

  // Recursively traverse the dependencies to print the tree.
  function traverse (result: archy.Tree, tree: DependencyTree) {
    const { nodes } = result

    children(nodes, tree.dependencies)
    children(nodes, tree.devDependencies, chalk.gray('(dev)'))
    children(nodes, tree.peerDependencies, chalk.gray('(peer)'))
    children(nodes, tree.globalDependencies, chalk.gray('(global)'))
    children(nodes, tree.globalDevDependencies, chalk.gray('(global dev)'))

    return result
  }

  const archyTree = traverse(result, options.tree)

  // Print "no dependencies" on empty tree.
  if (archyTree.nodes.length === 0) {
    archyTree.nodes.push(chalk.gray('(No dependencies)'))
  }

  return archy(archyTree, '', { unicode: options.unicode })
}
