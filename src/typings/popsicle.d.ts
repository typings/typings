declare module 'popsicle' {

  interface Query {
    [key: string]: string | string[];
  }

  interface Headers {
    [name: string]: string | string[];
  }

  interface HeaderNames {
    [name: string]: string;
  }

  interface BaseOptions {
    url?: string;
    query?: string | Query;
    headers?: Headers;
  }

  class Base {
    url: string;
    headers: Headers;
    headerNames: HeaderNames;
    query: Query;
    constructor({url, headers, query}: BaseOptions);
    set(headers: Headers): Base;
    set(name: string, value: string | string[]): Base;
    append(name: string, value: string | string[]): Base;
    name(name: string): string;
    get(): Headers;
    get(name: string): string;
    remove(name: string): Base;
    type(): string;
    type(value: string): Base;
    fullUrl(): string;
  }

  interface DefaultsOptions extends BaseOptions {
    url?: string;
    method?: string;
    timeout?: number;
    body?: any;
    options?: any;
    use?: Middleware[];
    transport?: TransportOptions;
  }

  interface RequestOptions extends DefaultsOptions {
    url: string;
  }

  interface PopsicleError extends Error {
    type: string;
    popsicle: Request;
    original?: Error;
  }

  interface RequestJSON {
    url: string;
    headers: Headers;
    body: any;
    timeout: number;
    options: any;
    method: string;
  }

  interface TransportOptions {
    open: OpenHandler;
    abort?: AbortHandler;
    use?: Middleware[];
  }

  interface ResponseOptions extends BaseOptions {
    body: any;
    status: number;
  }

  interface ResponseJSON {
    headers: Headers;
    body: any;
    url: string;
    status: number;
  }

  class Response extends Base {
    status: number;
    body: any;
    request: Request;
    constructor(options: ResponseOptions);
    statusType(): number;
    error(message: string, type: string, error?: Error): PopsicleError;
    toJSON(): ResponseJSON;
  }

  class Request extends Base {
    method: string;
    timeout: number;
    body: any;
    options: any;
    response: Response;
    raw: any;
    errored: Error;
    aborted: boolean;
    timedout: boolean;
    opened: boolean;
    started: boolean;
    uploadLength: number;
    downloadLength: number;
    constructor(options: RequestOptions);
    use(fn: Middleware | Middleware[]): Request;
    error(message: string, type: string, original?: Error): PopsicleError;
    then(onFulfilled: (response?: Response) => any, onRejected?: (error?: PopsicleError) => any): Promise<any>;
    catch(onRejected: (error?: PopsicleError) => any): Promise<any>;
    exec(cb: (err: Error, response?: Response) => any): void;
    toJSON(): RequestJSON;
    progress(fn: RequestPluginFunction): Request;
    before(fn: RequestPluginFunction): Request;
    after(fn: ResponsePluginFunction): Request;
    always(fn: RequestPluginFunction): Request;
    abort(): Request;
    uploaded: number;
    downloaded: number;
    completed: number;
    completedBytes: number;
    totalBytes: number;
    uploadedBytes: number;
    downloadedBytes: number;
  }

  type Middleware = (request?: any) => any;

  type RequestPluginFunction = (request?: Request) => any;
  type ResponsePluginFunction = (response?: Response) => any;

  type OpenHandler = (request: Request) => Promise<ResponseOptions>;
  type AbortHandler = (request: Request) => any;

  interface Popsicle {
    (options: RequestOptions | string): Request;
    plugins: {
      cookieJar(request: Request): void;
      unzip(request: Request): void;
      concatStream(encoding: string): (request: Request) => void;
      headers(request: Request): void;
      defaults: Middleware[];
    };
    Request: typeof Request;
    Response: typeof Response;
    defaults: (defaults: DefaultsOptions) => Popsicle;
    form(obj: any): FormData;
    jar(store?: any): any;
    browser: boolean;
    get(options: RequestOptions | string): Request;
    post(options: RequestOptions | string): Request;
    put(options: RequestOptions | string): Request;
    head(options: RequestOptions | string): Request;
    delete(options: RequestOptions | string): Request;
    options(options: RequestOptions | string): Request;
    trace(options: RequestOptions | string): Request;
    copy(options: RequestOptions | string): Request;
    lock(options: RequestOptions | string): Request;
    mkcol(options: RequestOptions | string): Request;
    move(options: RequestOptions | string): Request;
    purge(options: RequestOptions | string): Request;
    propfind(options: RequestOptions | string): Request;
    proppatch(options: RequestOptions | string): Request;
    unlock(options: RequestOptions | string): Request;
    report(options: RequestOptions | string): Request;
    mkactivity(options: RequestOptions | string): Request;
    checkout(options: RequestOptions | string): Request;
    merge(options: RequestOptions | string): Request;
    'm-search'(options: RequestOptions | string): Request;
    notify(options: RequestOptions | string): Request;
    subscribe(options: RequestOptions | string): Request;
    unsubscribe(options: RequestOptions | string): Request;
    patch(options: RequestOptions | string): Request;
    search(options: RequestOptions | string): Request;
    connect(options: RequestOptions | string): Request;
  }

  const popsicle: Popsicle;

  export = popsicle;

}
