import { open } from 'typings-core'

export function help () {
  console.log(`
typings open <location>
`)
}

export function exec (args: string[]) {
  console.log(open(args[0]))
}
