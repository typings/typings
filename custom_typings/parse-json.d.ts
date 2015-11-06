declare module 'parse-json' {
  function parseJson (source: string, reviver?: Function, filename?: string): any

  export = parseJson
}
