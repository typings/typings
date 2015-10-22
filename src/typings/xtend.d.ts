declare module 'xtend/mutable' {
  function extend <T> (dest: T): T
  function extend <T, A> (dest: T, a: A): T & A
  function extend <T, A, B> (dest: T, a: A, b: B): T & A & B
  function extend <T, A, B, C> (dest: T, a: A, b: B, c: C): T & A & B & C

  export = extend
}

declare module 'xtend/immutable' {
  function extend <T> (dest: T): T
  function extend <T, A> (dest: T, a: A): T & A
  function extend <T, A, B> (dest: T, a: A, b: B): T & A & B
  function extend <T, A, B, C> (dest: T, a: A, b: B, c: C): T & A & B & C

  export = extend
}

declare module 'xtend' {
  import immutable = require('xtend/immutable')

  export = immutable
}
