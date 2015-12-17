declare module 'proxy-agent' {
  import { Agent } from 'http';

  class ProxyAgent extends Agent {
    constructor (uri: string | { protocol: string; host: string; port?: string; proxies?: any });
  }

  export = ProxyAgent;
}
