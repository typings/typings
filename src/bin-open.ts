import { open } from 'typings-core'

export function help () {
  return `
typings open <location>

  <location>  A known Typings location with scheme
`
}

export function exec (args: string[]) {
  console.log(open(args[0]))
}
