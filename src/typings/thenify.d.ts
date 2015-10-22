declare module 'thenify' {
  type Callback <T> = (err: any, value?: T) => any

  function thenify <A, Z> (fn: (a: A, cb: Callback<Z>) => any): (a: A) => Promise<Z>
  function thenify <A, B, Z> (fn: (a: A, b: B, cb: Callback<Z>) => any): (a: A, b: B) => Promise<Z>
  function thenify <A, B, C, Z> (fn: (a: A, b: B, c: C, cb: Callback<Z>) => any): (a: A, b: B, c: C) => Promise<Z>

  export = thenify
}
