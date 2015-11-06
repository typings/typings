declare module 'log-update' {
  function logUpdate (...text: string[]): void

  module logUpdate {
    function clear (): void
    function done (): void
    function stderr (...text: string[]): void
    function create (stream: any): void

    module stderr {
      function clear (): void
      function done (): void
    }
  }

  export = logUpdate
}
