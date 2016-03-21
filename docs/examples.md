# Examples

Here are some examples you can use as a model when writing your typings.

There are a few kinds of source package:

1. Package that is part of the environment.
2. Package that should be loaded in a script tag.
3. Package that written in CommonJs / NodeJs style
  1. Package that also pollutes the global namespace
4. Package that written in ES6+
  1. Package that also pollutes the global namespace
5. Package that written in TypeScript and compiled to JavaScript with declaration `.d.ts` files.

For 1 and 2, you will create an ambient (global) typing.

For 3, you will create an external module typing using `export =`.

For 4, you will create an external module typing using ESM syntax (ES6/ES2015 default export and named export).

For 5, you probably don't need to write typings for it.
The declaration files included in the package should be accurate.


## Ambient (global) typing
### Namespace
```ts
// ABC.d.ts
declare namespace ABC {
  export function foo(): void;
}

// Consumer.ts
ABC.foo();
```

## External Module with `export =`
### Single function
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

### Utility library
Exposing a collection of utility functions and classes.

```ts
declare namespace JsDiff {
  class Diff {}
  function diffChars(): any;
}

export = JsDiff;
```

* https://github.com/typed-typings/npm-diff

### Function + utility
Exposing a function, with utility methods.

```ts
declare function tape (): any;

declare namespace tape {
  export function skip (): any;
}

export = tape;
```

* https://github.com/typed-typings/npm-tape

### Exporting class + static methods + utility
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

## External Module with ESM syntax
### Named export
Export directly using ES6 semantics without a module or namespace.

```ts
export function valid(): any;

export class SemVer {}
```

* https://github.com/typed-typings/npm-semver
