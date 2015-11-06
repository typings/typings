declare module 'wordwrap' {
  interface Options {
    wrap: string
  }

  function wrap (value: string): string

  function wordwrap (stop: number): typeof wrap
  function wordwrap (start: number, stop: number, options?: Options): typeof wrap

  namespace wordwrap {
    export function hard (stop: number): typeof wrap
  }

  export = wordwrap
}
