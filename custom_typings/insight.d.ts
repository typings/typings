declare module 'insight' {
  interface Options {
    trackingCode: string;
    trackingProvider?: string;
    pkg: {
      name: string;
      version: string;
    }
    config?: any;
  }

  class Insight {
    trackingCode: string;
    trackingProvider: string;
    packageName: string;
    packageVersion: string;
    os: string;
    nodeVersion: string;
    appVersion: string;
    config: any;

    optOut: boolean;
    clientId: string;

    constructor (options: Options);

    track (...args: string[]):void;
    askPermission (msg?: string, cb?: Function): void;
  }

  export = Insight;
}
