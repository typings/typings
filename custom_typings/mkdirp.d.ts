declare module 'mkdirp' {
  function mkdirp (path: string, cb: (err: Error) => void): void

  module mkdirp {
    function sync (path: string): void
  }

  export = mkdirp
}
