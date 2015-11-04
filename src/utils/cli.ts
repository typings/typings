import logUpdate = require('log-update')
import spinner = require('elegant-spinner')
import chalk = require('chalk')
import Promise = require('native-or-bluebird')
import promiseFinally from 'promise-finally'

export interface Options {
  verbose: boolean
}

export function wrapExecution (promise: any, options?: Options) {
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
    })
}
