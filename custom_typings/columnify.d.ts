declare module 'columnify' {
  function columnify (data: { [key: string]: any } | any[]): string;

  export = columnify;
}