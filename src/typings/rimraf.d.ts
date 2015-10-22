declare module 'rimraf' {
  function rimraf (path: string, cb: (err: Error) => any): void

  module rimraf {
    function sync (path: string): void
  }

  export = rimraf
}
