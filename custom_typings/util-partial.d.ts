declare module 'util-partial' {
  // NOTE: Without proper spread generics, this is fairly manual.

  // One arg.
  function partial <A, T> (fn: (a: A) => T): (a: A) => T
  function partial <A, T> (fn: (a: A) => T, a: A): () => T

  // Two args.
  function partial <A, B, T> (fn: (a: A, b: B) => T): (a: A, b: B) => T
  function partial <A, B, T> (fn: (a: A, b: B) => T, a: A): (b: B) => T
  function partial <A, B, T> (fn: (a: A, b: B) => T, a: A, b: B): () => T

  // Three args.
  function partial <A, B, C, T> (fn: (a: A, b: B, c: C) => T): (a: A, b: B, c: C) => T
  function partial <A, B, C, T> (fn: (a: A, b: B, c: C) => T, a: A): (b: B, c: C) => T
  function partial <A, B, C, T> (fn: (a: A, b: B, c: C) => T, a: A, b: B): (c: C) => T
  function partial <A, B, C, T> (fn: (a: A, b: B, c: C) => T, a: A, b: B, c: C): () => T

  // Four args.
  function partial <A, B, C, D, T> (fn: (a: A, b: B, c: C, d: D) => T): (a: A, b: B, c: C, d: D) => T
  function partial <A, B, C, D, T> (fn: (a: A, b: B, c: C, d: D) => T, a: A): (b: B, c: C, d: D) => T
  function partial <A, B, C, D, T> (fn: (a: A, b: B, c: C, d: D) => T, a: A, b: B): (c: C, d: D) => T
  function partial <A, B, C, D, T> (fn: (a: A, b: B, c: C, d: D) => T, a: A, b: B, c: C): (d: D) => T
  function partial <A, B, C, D, T> (fn: (a: A, b: B, c: C, d: D) => T, a: A, b: B, c: C, d: D): () => T

  export = partial
}
