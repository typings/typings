// Type definitions for chalk v0.4.0
// Project: https://github.com/sindresorhus/chalk
// Definitions by: Diullei Gomes <https://github.com/Diullei>, Bart van der Schoor <https://github.com/Bartvds>
// Definitions: https://github.com/borisyankov/DefinitelyTyped

declare module "chalk" {
  interface Styles <T> {
    // General
    reset: T;
    bold: T;
    italic: T;
    underline: T;
    inverse: T;
    strikethrough: T;

    // Text colors
    black: T;
    red: T;
    green: T;
    yellow: T;
    blue: T;
    magenta: T;
    cyan: T;
    white: T;
    gray: T;
    grey: T;

    // Background colors
    bgBlack: T;
    bgRed: T;
    bgGreen: T;
    bgYellow: T;
    bgBlue: T;
    bgMagenta: T;
    bgCyan: T;
    bgWhite: T;
  }

  interface Chalk extends Styles<ChalkChain> {
    enabled: boolean;
  }

  interface ChalkChain extends Chalk {
    (value: string): string;
  }

  interface StyleElement {
    open: string;
    close: string;
    closeRe: RegExp;
  }

  interface ChalkExports extends Chalk {
    constructor (options: { enabled: boolean }): Chalk;

    styles: Styles<StyleElement>;
    supportsColor: boolean;
    hasColor (value: string): boolean;
    stripColor (value: string): string;
  }

  var chalk: ChalkExports;

  export = chalk;
}
