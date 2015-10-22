declare module 'object-values' {
  function values <T> (obj: { [key: number]: T}): T[]

  export = values
}
