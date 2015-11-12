import logUpdate = require('log-update')
import spinner = require('elegant-spinner')
import chalk = require('chalk')
import Promise = require('native-or-bluebird')
import promiseFinally from 'promise-finally'
import inquirer = require('inquirer')

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
  const frame = spinner()
  const update = () => logUpdate(frame())
  const interval = setInterval(update, 50)

  function end () {
    clearInterval(interval)
    logUpdate.clear()
  }

  update()

  return promiseFinally(Promise.resolve(promise), end)
    .catch((error: Error) => {
      console.log(chalk.red(`${error.name}: ${error.message}`))

      if (options.verbose && 'stack' in error) {
        console.log((<any> error).stack)
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
