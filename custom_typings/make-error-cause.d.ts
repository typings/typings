declare module "make-error-cause" {
  export class BaseError extends Error {
    stack: string;
    cause: Error;
    constructor (message: string, cause?: Error);
  }
}