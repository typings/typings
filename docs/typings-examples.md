# Examples
Here are some examples based on different shapes of the source module.

## Exporting one function

```ts
declare function domready (...): any;

export = domready
```
https://github.com/typed-typings/npm-domready

## Export function with overloads
```ts
declare function xtend <A> (a: A): A;
declare function xtend <A, B> (a: A, b: B): A & B;
export = extend;
```
https://github.com/typed-typings/npm-xtend

## Exporting function + utility

```ts
declare function globby (...): any;

declare module globby {
  function sync (...): any;
}

export = globby;
```
https://github.com/typed-typings/npm-globby

```ts
declare function tape(): any;
declare module tape {
  export function skip(): any;
}

export = tape;
```
https://github.com/typed-typings/npm-tape

## Exporting immutable utility

```ts
declare module JsDiff {
  class Diff {}
  function diffChars(): any
}
export = JsDiff;
```
https://github.com/typed-typings/npm-diff

## Exporting class
TODO

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
https://github.com/typed-typings/npm-bluebird


## Exporting multiple subpath modules
TODO
Examples: `core-js`, `material-ui`

## Named export (ES6)

```ts
export function valid(): any;

export class SemVer {}
```
https://github.com/typed-typings/npm-semver

## Default export (ES6)
