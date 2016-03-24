# Examples

Here are some examples you can use as a model when writing your typings.

There are a number of kinds of source package which you may write type definitions for:

1. Package that, when loaded, extends the global scope environment with a number of new functions / variables / classes etc (eg [mocha](https://github.com/typed-typings/env-mocha))
2. Package that should be loaded using a script tag (eg [knockout](https://github.com/typed-contrib/knockout/tree/master/global))
3. Package that should be loaded with a CommonJs / NodeJs compatible loader such as npm, browserify, webpack etc (eg [knockout again!](https://github.com/typed-contrib/knockout))
  1. Package that also pollutes the global namespace
4. Package that written in ES6+
  1. Package that also pollutes the global namespace
5. Package that is written in TypeScript and compiled to JavaScript with declaration `.d.ts` files (eg [globalize-so-what-cha-want](https://www.npmjs.com/package/globalize-so-what-cha-want))

For 1 and 2, you would create an ambient (global) typing.

For 3, you would create an external module typing using `export =`.

For 4, you would create an external module typing using ES6 module syntax (default export and named export).

For 5, you probably don't need to write typings for it; The declaration files included in the package should be accurate and the TypeScript compiler should automatcally try to use them upon consumption.

## Ambient (Global) Typings

### Namespace

```ts
// ABC.d.ts
declare namespace ABC {
  export function foo(): void;
}

// Consumer.ts
ABC.foo();
```

## External Module With `export =`

### Single Function

Exposing a single function.

```ts
declare function domready (...): any;

export = domready
```

* https://github.com/typed-typings/npm-domready

Function with overloads.

```ts
declare function xtend <A> (a: A): A;
declare function xtend <A, B> (a: A, b: B): A & B;
export = xtend;
```

* https://github.com/typed-typings/npm-xtend

### Utility Library

Exposing a collection of utility functions and classes.

```ts
declare namespace JsDiff {
  class Diff {}
  function diffChars(): any;
}

export = JsDiff;
```

* https://github.com/typed-typings/npm-diff

### Function + Utility

Exposing a function, with utility methods.

```ts
declare function tape (): any;

declare namespace tape {
  export function skip (): any;
}

export = tape;
```

* https://github.com/typed-typings/npm-tape

### Exporting Class + Static Methods + Utility

```ts
declare class Promise <R> {
  static resolve(): Promise<void>;
}

declare namespace Promise {
  export interface SpreadOption {}
  export function setScheduler (): any;
}

export = Promise;
```

* https://github.com/typed-typings/npm-bluebird

## External Module with ES6 Syntax

### Named Export

Export directly using ES6 semantics without a module or namespace.

```ts
export function valid(): any;

export class SemVer {}
```

* https://github.com/typed-typings/npm-semver
