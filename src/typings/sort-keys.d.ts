declare module 'sort-keys' {
  function sortKeys <T> (obj: T, compare?: Function): T;

  export = sortKeys;
}
