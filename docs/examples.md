# Examples

There are a number of kinds of source package which you may write typings for:

1. Packages that, when loaded, extend the global scope environment with a number of new functions / variables / classes etc. An example is [mocha](https://github.com/mochajs/mocha) which has [a global type definition](https://github.com/typed-typings/env-mocha) and is listed in the [Typings Registry under env](https://github.com/typings/registry/blob/master/env/mocha.json).

2. Packages that should be loaded using a script tag. An example is [knockout](https://github.com/knockout/knockout) which has [this global type definition](https://github.com/typed-contrib/knockout/tree/master/global) and is listed in the [Typings Registry under global](https://github.com/typings/registry/blob/master/global/knockout.json).

3. Packages that should be loaded with a CommonJs / NodeJs compatible loader such as npm, browserify, webpack etc. An example is [knockout on npm](https://www.npmjs.com/package/knockout) which has an [external module type definition](https://github.com/typed-contrib/knockout) and is listed in the [Typings Registry under npm](https://github.com/typings/registry/blob/master/npm/knockout.json))

4. Packages that are written in ES6+

5. Packages that are written in TypeScript and compiled to JavaScript with declaration `.d.ts` files (eg [globalize-so-what-cha-want](https://www.npmjs.com/package/globalize-so-what-cha-want))

For 1 and 2, you would create a global type definition.

For 3, you would create an external module type definition using `export =`.

For 4, you would create an external module type definition using ES6 module syntax (default export and named export).

For 5, there should be no need to write a type definition. The declaration files included in the package should be automatically detected and used by the TypeScript compiler upon consumption of the package.

For cases 1-4, here are some examples you can use as a model when writing your typings:

## Global Typings

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

### Export with Internal Types

```ts
declare function doSomething(value: doSomething.Foo): void

declare namespace doSomething {
  export interface Foo { ... }
}
```

## External Module with ES6 Syntax

### Named Export

Export directly using ES6 semantics without a module or namespace.

```ts
export function valid(): any;

export class SemVer {}
```

* https://github.com/typed-typings/npm-semver
