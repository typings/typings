declare module 'touch' {
  function touch (filename: string, options: touch.Options, cb: (err: Error) => any): void;

  module touch {
    export interface Options {
      force?: boolean;
      time?: Date | string | number;
      atime?: boolean | Date;
      mtime?: boolean | Date;
      ref?: string;
      nocreate?: boolean;
    }
  }

  export = touch;
}
