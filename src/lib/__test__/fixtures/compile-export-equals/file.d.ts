declare function foo (value: string): foo.Bar;

declare module foo {
  export interface Bar {
    (message: any, ...args: any[]): void;
    enabled: boolean;
    namespace: string;
  }
}

export = foo;
