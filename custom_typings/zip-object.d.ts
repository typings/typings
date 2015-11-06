declare module 'zip-object' {
  function zipObject <T> (keys: string[], values: T[]): { [key: string]: T }

  export = zipObject
}
