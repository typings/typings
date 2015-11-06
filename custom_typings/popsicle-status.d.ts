declare module 'popsicle-status' {
  function popsicleStatus (lower?: number, upper?: number): (response: any) => any

  export = popsicleStatus
}
