# Examples
Here are some examples you can model after when writing your own typings.

## Single function

Exposing a single function.

```ts
declare function domready (...): any;

export = domready
```

* https://github.com/typed-typings/npm-domready

Function with overloads

```ts
declare function xtend <A> (a: A): A;
declare function xtend <A, B> (a: A, b: B): A & B;
export = xtend;
```

* https://github.com/typed-typings/npm-xtend

## Utility library

Exposing a collection of utility functions and classes.

```ts
declare module JsDiff {
  class Diff {}
  function diffChars(): any
}

export = JsDiff;
```

* https://github.com/typed-typings/npm-diff

## Function + utility

Exposing a function, with utility methods.

```ts
declare function tape(): any;
declare module tape {
  export function skip(): any;
}

export = tape;
```

* https://github.com/typed-typings/npm-tape

## Exporting class + static methods + utility (ES6)
```ts
declare class Promise<R> {
  static resolve(): Promise<void>;
}

declare module Promise {
  export interface SpreadOption {}
  export function setScheduler(): any;
}
export = Promise;
```

* https://github.com/typed-typings/npm-bluebird

## Named export (ES6)

Export directly without namespace or module.

```ts
export function valid(): any;

export class SemVer {}
```

* https://github.com/typed-typings/npm-semver
