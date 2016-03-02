import * as imported from './import'

declare module './import' {
  namespace main {
    export function augmented (): boolean;
  }
}

export { imported }