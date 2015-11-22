declare module 'popsicle-cache' {
  function popsicleCache (options?: any): (response: any) => any;

  module popsicleCache {
    export class Store {
      constructor (options: { path: string });
    }
  }

  export = popsicleCache;
}
