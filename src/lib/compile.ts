import * as ts from 'typescript'
import extend = require('xtend')
import zipObject = require('zip-object')
import partial = require('util-partial')
import has = require('has')
import values = require('object-values')
import Promise = require('native-or-bluebird')
import { EOL } from 'os'
import { join } from 'path'
import { DependencyTree, DependencyBranch, Browser, Overrides } from '../interfaces/main'
import { readFileFrom } from '../utils/fs'
import { resolveFrom, relativeTo, isModuleName, normalizeSlashes, toDefinition, fromDefinition, normalizeToDefinition } from '../utils/path'
import { REFERENCE_REGEXP } from '../utils/references'

/**
 * Options interface. Supply a name and the current working directory.
 */
export interface Options {
  cwd: string
  name: string
  ambient: boolean
  strict?: boolean
}

/**
 * Compile a dependency tree using a root name.
 */
export default function compile (tree: DependencyTree, options: Options) {
  const files: ts.Map<Promise<string>> = {}

  return Promise.all([
    compileDependencyTree(tree, extend(options, { browser: false, files })),
    compileDependencyTree(tree, extend(options, { browser: true, files }))
  ])
    .then(([main, browser]) => ({ main, browser }))
}

/**
 * Extends the default options with different compilation settings.
 */
interface CompileOptions extends Options {
  files: ts.Map<Promise<string>>
  browser: boolean
}

/**
 * Get stringify options for a dependency.
 */
function getStringifyOptions (tree: DependencyTree, options: CompileOptions): StringifyOptions {
  const overrides: Overrides = {}
  const isTypings = typeof tree.typings === 'string'
  const main = isTypings ? tree.typings : tree.main
  const browser = isTypings ? tree.browserTypings : tree.browser

  // TODO(blakeembrey): Warn when using `typings` and a browser field.

  if (options.browser && browser) {
    if (typeof browser === 'string') {
      const mainDefinition = resolveFrom(tree.src, normalizeToDefinition(main))
      const browserDefinition = resolveFrom(tree.src, normalizeToDefinition(<string> browser))

      overrides[mainDefinition] = browserDefinition
    } else {
      const browserOverrides = <Overrides> browser

      for (const key of Object.keys(browserOverrides)) {
        if (!isModuleName(key)) {
          const from = resolveFrom(tree.src, normalizeToDefinition(key))
          const to = resolveFrom(tree.src, normalizeToDefinition(browserOverrides[key]))

          overrides[from] = to
        } else {
          overrides[key] = browserOverrides[key]
        }
      }
    }
  }

  const imported: ts.Map<boolean> = {}
  const dependencies: ts.Map<StringifyOptions> = {}
  const entry = resolveFrom(tree.src, normalizeToDefinition(main))

  return extend(options, {
    tree,
    entry,
    isTypings,
    overrides,
    imported,
    dependencies
  })
}

/**
 * Compile a dependency tree to a single definition.
 */
function compileDependencyTree (tree: DependencyTree, options: CompileOptions): Promise<string> {
  return compileDependencyPath(null, getStringifyOptions(tree, options))
}

/**
 * Compile a dependency for a path, with pre-created stringify options.
 */
function compileDependencyPath (path: string, options: StringifyOptions) {
  const { tree, entry } = options

  return stringifyDependencyPath(resolveFrom(tree.src, path == null ? entry : path), options)
}

/**
 * Stringify options extend the compiler options.
 */
interface StringifyOptions extends CompileOptions {
  entry: string
  isTypings: boolean
  overrides: Overrides
  imported: ts.Map<boolean>
  dependencies: ts.Map<StringifyOptions>
  tree: DependencyTree
}

/**
 * Read a file with a backup cache object.
 */
function cachedReadFileFrom (path: string, options: { files: ts.Map<Promise<string>> }) {
  if (!has(options.files, path)) {
    options.files[path] = readFileFrom(path)
  }

  return options.files[path]
}

/**
 * Return cached stringify options from the current options object.
 */
function cachedStringifyOptions (name: string, compileOptions: CompileOptions, options: StringifyOptions) {
  const tree = getDependency(name, options)

  if (!has(options.dependencies, name)) {
    if (tree) {
      options.dependencies[name] = getStringifyOptions(tree, compileOptions)
    } else {
      options.dependencies[name] = null
    }
  }

  return options.dependencies[name]
}

/**
 * Get dependency from stringify options.
 */
function getDependency (name: string, options: StringifyOptions) {
  const { tree, overrides } = options

  if (has(options.overrides, name)) {
    return tree.dependencies[overrides[name]]
  }

  if (has(tree.dependencies, name)) {
    return tree.dependencies[name]
  }

  if (options.strict) {
    throw new TypeError(`Unable to resolve "${name}" from "${options.name}"`)
  }
}

/**
 * Stringify a dependency file.
 */
function stringifyDependencyPath (path: string, options: StringifyOptions): Promise<string> {
  let definitionPath = normalizeToDefinition(path)

  if (has(options.overrides, definitionPath)) {
    definitionPath = options.overrides[definitionPath]
  }

  return cachedReadFileFrom(definitionPath, options)
    .then(contents => {
      const info = ts.preProcessFile(contents)
      const { tree, ambient, cwd, browser, name, files } = options
      const ambientModules = info.ambientExternalModules || []

      // Skip output of lib files.
      if (info.isLibFile) {
        return
      }

      if (ambientModules.length && !ambient) {
        return Promise.reject(new TypeError(`Attempted to compile ${name} as non-ambient when it contains external module declarations`))
      }

      const importedFiles = info.importedFiles.map(x => isModuleName(x.fileName) ? x.fileName : resolveFrom(path, x.fileName))
      const referencedFiles = info.referencedFiles.map(x => resolveFrom(path, x.fileName))

      // All dependencies MUST be imported for ambient modules.
      if (ambient) {
        Object.keys(tree.dependencies).forEach(x => importedFiles.push(x))
      }

      const imports = importedFiles.map(path => {
        // Return `null` to skip the dependency writing, could have the same import twice.
        if (has(options.imported, path)) {
          return
        }

        // Support inline ambient module declarations.
        if (ambientModules.indexOf(path) > -1) {
          return
        }

        // Set the file to "already imported" to avoid duplication.
        options.imported[path] = true

        if (isModuleName(path)) {
          const parts = path.split('/')
          const dependencyName = parts.shift()
          const dependencyPath = parts.length === 0 ? null : parts.join('/')
          const moduleName = ambient ? dependencyName : `${name}!${dependencyName}`
          const compileOptions = { cwd, browser, files, name: moduleName, ambient: false }
          const stringifyOptions = cachedStringifyOptions(dependencyName, compileOptions, options)

          // When no options are returned, the dependency is missing.
          if (!stringifyOptions) {
            return
          }

          return compileDependencyPath(dependencyPath, stringifyOptions)
        }

        return stringifyDependencyPath(path, options)
      })

      // const references = referencedFiles.map(path => {
      //   return has(options.resolved, path) ? options.resolved[path] : readFileFrom(path)
      // })

      return Promise.all(imports)
        .then(files => {
          files.push(stringifyFile(path, contents.replace(REFERENCE_REGEXP, ''), options))

          // Filter skipped dependencies.
          return files.filter(x => x != null).join(EOL)
        })
    })
}

/**
 * Stringify a dependency file contents.
 */
function stringifyFile (path: string, contents: string, options: StringifyOptions) {
  const sourceFile = ts.createSourceFile(path, contents, ts.ScriptTarget.Latest, true)
  const { tree, name } = options

  let isES6Export = true
  let wasDeclared = false

  // TODO(blakeembrey): Provide validation for ambient modules
  if (options.ambient) {
    if ((<any> sourceFile).externalModuleIndicator) {
      throw new TypeError(`Unable to compile "${path}" - looks like an external module`)
    }

    return contents.trim()
  }

  // Stringify the import path to a namespaced import.
  function importPath (name: string) {
    if (isModuleName(name)) {
      return `${options.name}!${name}`
    }

    const modulePath = relativeTo(tree.src, resolveFrom(path, name))

    return normalizeSlashes(join(options.name, modulePath))
  }

  // Custom replacer function to rewrite the file.
  function replacer (node: ts.Node) {
    // Flag `export =` as the main re-definition needs to be written different.
    if (node.kind === ts.SyntaxKind.ExportAssignment) {
      isES6Export = !(<ts.ExportAssignment> node).isExportEquals
    }

    if (
      node.kind === ts.SyntaxKind.StringLiteral &&
      (
        node.parent.kind === ts.SyntaxKind.ExportDeclaration ||
        node.parent.kind === ts.SyntaxKind.ImportDeclaration
      )
    ) {
      return ` '${importPath((<ts.StringLiteral> node).text)}'`
    }

    if (node.kind === ts.SyntaxKind.DeclareKeyword) {
      // Notify the reader to remove leading trivia.
      wasDeclared = true

      return sourceFile.text.slice(node.getFullStart(), node.getStart())
    }

    if (node.kind === ts.SyntaxKind.ExternalModuleReference) {
      const path = importPath((<any> node).expression.text)

      return ` require('${path}')`
    }
  }

  // Read through the file.
  function read (start: number, end: number) {
    const text = sourceFile.text.slice(start, end)

    // Trim trailing whitespace.
    if (end == null) {
      return text.replace(/\s+$/, '')
    }

    // Remove leading whitespace from the statement after "declare".
    if (wasDeclared) {
      wasDeclared = false

      return text.replace(/^\s+/, '')
    }

    return text
  }

  const moduleText = processTree(sourceFile, replacer, read)

  const isEntry = options.entry === path

  // Direct usage of definition/typings. This is *not* a psuedo-module.
  if (isEntry && options.isTypings) {
    return declareText(name, moduleText)
  }

  const moduleName = `${name}/${normalizeSlashes(relativeTo(tree.src, fromDefinition(path)))}`
  const declared = declareText(moduleName, moduleText)

  if (!isEntry) {
    return declared
  }

  const importText = isES6Export ?
    `export * from '${moduleName}';` :
    `import main = require('${moduleName}');${EOL}export = main;`

  return `${declared}${EOL}${declareText(name, importText)}`
}

/**
 * Declare a module.
 */
function declareText (name: string, text: string) {
  return `declare module '${name}' {${EOL}${text}${EOL}}`
}

/**
 * Rewrite TypeScript source files.
 *
 * Original Source: https://github.com/SitePen/dts-generator/blob/22402351ffd953bf32344a0e48f2ba073fc5b65a/index.ts#L70-L101
 */
function processTree (sourceFile: ts.SourceFile, replacer: (node: ts.Node) => string, read: (start: number, end?: number) => string): string {
  let code = ''
  let position = 0

  function skip (node: ts.Node) {
    position = node.end
  }

  function readThrough (node: ts.Node) {
    code += read(position, node.pos)
    position = node.pos
  }

  function visit (node: ts.Node) {
    readThrough(node)

    const replacement = replacer(node)

    if (replacement != null) {
      code += replacement
      skip(node)
    }
    else {
      ts.forEachChild(node, visit)
    }
  }

  visit(sourceFile)

  code += read(position)

  return code
}
