declare module 'invariant' {
  function invariant (condition: boolean, message: string, ...args: string[]): void;

  export = invariant;
}
