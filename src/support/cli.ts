import chalk = require('chalk')
import archy = require('archy')
import listify = require('listify')
import logUpdate = require('log-update')
import elegantSpinner = require('elegant-spinner')
import truncate = require('cli-truncate')
import * as os from 'os'
import { DependencyTree, DependencyBranch } from 'typings-core'
import promiseFinally from 'promise-finally'

const pkg = require('../../package.json')

/**
 * Keep track of a progress spinner.
 */
let statusFrame: (() => string) | undefined
let statusTimeout: NodeJS.Timer | undefined
let statusMessage: string | undefined

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
  logUpdate.clear()
  console.error(message)
  render()
}

/**
 * Format a message line.
 */
function formatLine (color: Function, type: string, line: string, prefix?: string) {
  return `${chalk.bgBlack.white('typings')} ${color(type)} ${prefix ? chalk.magenta(`${prefix} `) : ''}${line}`
}

/**
 * Available log levels.
 */
const loglevels: { [key: string]: number } = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
  silent: 4
}

/**
 * Current logging level.
 */
let loglevel: number = loglevels['info']

/**
 * Set the level of logs to emit.
 */
export function setLoglevel (level: string): number | undefined {
  if (!loglevels.hasOwnProperty(level)) {
    logError(`invalid log level (options are ${listify(Object.keys(loglevels))})`)
    return
  }

  return (loglevel = loglevels[level])
}

/**
 * Log an info message.
 */
export function logInfo (message: string, prefix?: string) {
  if (loglevel > loglevels['info']) {
    return
  }

  const output = message.split(/\r?\n/g).map(line => {
    return formatLine(chalk.bgBlack.cyan, 'INFO', line, prefix)
  }).join('\n')

  log(output)
}

/**
 * Log a warning message.
 */
export function logWarning (message: string, prefix?: string) {
  if (loglevel > loglevels['warn']) {
    return
  }

  const output = message.split(/\r?\n/g).map(line => {
    return formatLine(chalk.bgYellow.black, 'WARN', line, prefix)
  }).join('\n')

  log(output)
}

/**
 * Log an error message.
 */
export function logError (message: string, prefix?: string) {
  if (loglevel > loglevels['error']) {
    return
  }

  const output = message.split(/\r?\n/g).map(line => {
    return formatLine(chalk.bgBlack.red, 'ERR!', line, prefix)
  }).join('\n')

  log(output)
}

/**
 * Set the current status message.
 */
export function setStatus (message: string) {
  statusMessage = message
}

/**
 * Render the current status.
 */
export function render () {
  clearInterval(statusTimeout)

  if (statusFrame && (process.stdout as any).isTTY) {
    let status = chalk.cyan(statusFrame())

    if (statusMessage) {
      status += ` ${statusMessage}`
    }

    logUpdate(truncate(status, (process.stdout as any).columns))
  }
  statusTimeout = setTimeout(render, 50)
}

/**
 * Start the status spinner.
 */
export function startSpinner () {
  statusFrame = elegantSpinner()
  render()
}

/**
 * Stop the status spinner.
 */
export function stopSpinner () {
  clearTimeout(statusTimeout)

  statusFrame = undefined
  statusTimeout = undefined
  statusMessage = undefined

  logUpdate.clear()
  logUpdate.done()
}

/**
 * Create a spinner around the process.
 */
export function spinner <T> (promise: Promise<T> | T): Promise<T> {
  startSpinner()

  return promiseFinally(Promise.resolve(promise), stopSpinner)
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
    logError('')
    logError(error.stack, 'stack')
  }

  logError('')
  logError(process.cwd(), 'cwd')
  logError(`${os.type()} ${os.release()}`, 'system')
  logError(process.argv.map(arg => JSON.stringify(arg)).join(' '), 'command')
  logError(process.version, 'node -v')
  logError(pkg.version, `typings -v`)

  if ((error as any).code) {
    logError((error as any).code, 'code')
  }

  logError('')
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

  const tree = traverse(result, options.tree)

  return archy(tree, '', { unicode: options.unicode })
}
