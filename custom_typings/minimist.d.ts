declare module 'minimist' {
  function minimist <T> (args?: string[], opts?: minimist.Options): minimist.ParsedArgs & T;

  module minimist {
    export interface Options {
      string?: string | string[]
      boolean?: boolean | string | string[]
      alias?: { [key:string]: string[] }
      default?: { [key:string]: any }
      stopEarly?: boolean
      unknown?: (arg: string) => boolean
      '--'?: boolean
    }

    export interface ParsedArgs {
      _: string[]
      [key: string]: any
    }
  }

  export = minimist;
}
