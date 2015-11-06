declare module 'detect-indent' {
  interface Indent {
    amount: number
    type?: string
    indent: string
  }

  function detectIndent (content: string): Indent

  export = detectIndent
}
