/**
 * A dependency string is a string that maps to a resource. For example,
 * "file:foo/bar" or "npm:typescript".
 */
export type DependencyString = string

/**
 * Override map for file lookups.
 */
export interface Overrides {
  [dependency: string]: string
}

/**
 * Browser field overrides like NPM.
 */
export type Browser = string | Overrides

/**
 * The JSON configuration format.
 */
export interface ConfigJson {
  // Typing information.
  main?: string
  browser?: Browser
  ambient?: boolean
  typings?: string
  browserTypings?: string | Browser

  // Meta information.
  name?: string
  author?: string
  description?: string
  bugs?: string
  homepage?: string

  // Dependencies.
  dependencies?: Dependencies
  devDependencies?: Dependencies
  ambientDependencies?: Dependencies
  ambientDevDependencies?: Dependencies
}

/**
 * Dependencies can be an array for graceful degradation over services.
 */
export interface Dependencies {
  [name: string]: DependencyString | DependencyString[]
}

/**
 * Parsed dependency specification.
 */
export interface Dependency {
  type: string
  raw: string
  location: string
}

/**
 * Used for generating the structure of a tree.
 */
export interface DependencyTree {
  name?: string
  version?: string
  main?: string
  browser?: Browser
  typings?: string
  browserTypings?: Browser
  parent?: DependencyTree
  type: string
  src: string
  missing: boolean
  ambient: boolean
  dependencies: DependencyBranch
  devDependencies: DependencyBranch
  ambientDependencies: DependencyBranch
  ambientDevDependencies: DependencyBranch
}

/**
 * Map of dependency trees.
 */
export interface DependencyBranch {
  [name: string]: DependencyTree
}
