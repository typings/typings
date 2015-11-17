import * as ts from 'typescript'
import extend = require('xtend')
import has = require('has')
import Promise = require('native-or-bluebird')
import { EOL } from 'os'
import { join, relative } from 'path'
import { DependencyTree, Overrides } from '../interfaces/main'
import { readFileFrom } from '../utils/fs'
import { resolveFrom, relativeTo, isHttp, isModuleName, normalizeSlashes, fromDefinition, normalizeToDefinition } from '../utils/path'
import { REFERENCE_REGEXP } from '../utils/references'
import { PROJECT_NAME } from '../utils/config'
import { VERSION } from '../typings'

/**
 * Define the separator between module paths. E.g. `foo~bar`.
 *
 * Note: This used to be `!`, but it appears that breaks in TypeScript 1.8+.
 */
const SEPARATOR = '~'

/**
 * Options interface. Supply a name and the current working directory.
 */
export interface Options {
  cwd: string
  name: string
  ambient: boolean
  meta: boolean
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
function getStringifyOptions (
  tree: DependencyTree,
  options: CompileOptions,
  parent: StringifyOptions
): StringifyOptions {
  const overrides: Overrides = {}
  const isTypings = typeof tree.typings === 'string'
  const main = isTypings ? tree.typings : tree.main
  const browser = isTypings ? tree.browserTypings : tree.browser

  // TODO(blakeembrey): Warn when using `typings` and a browser field.

  if (options.browser && browser) {
    if (typeof browser === 'string') {
      const mainDefinition = resolveFrom(tree.src, normalizeToDefinition(main))
      const browserDefinition = resolveFrom(tree.src, normalizeToDefinition(browser))

      overrides[mainDefinition] = browserDefinition
    } else {
      const browserOverrides = browser

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
  const referenced: ts.Map<boolean> = {}
  const dependencies: ts.Map<StringifyOptions> = {}
  const entry = resolveFrom(tree.src, normalizeToDefinition(main))

  return extend(options, {
    tree,
    entry,
    isTypings,
    overrides,
    imported,
    referenced,
    dependencies,
    parent
  })
}

/**
 * Compile a dependency tree to a single definition.
 */
function compileDependencyTree (tree: DependencyTree, options: CompileOptions, parent?: StringifyOptions): Promise<string> {
  return compileDependencyPath(null, getStringifyOptions(tree, options, parent))
}

/**
 * Compile a dependency for a path, with pre-created stringify options.
 */
function compileDependencyPath (path: string, options: StringifyOptions) {
  const { tree, entry } = options

  if (tree.missing) {
    return Promise.reject(new Error(
      `Missing dependency "${toDependencyPath(options)}", unable to compile dependency tree`
    ))
  }

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
  referenced: ts.Map<boolean>
  dependencies: ts.Map<StringifyOptions>
  tree: DependencyTree
  parent: StringifyOptions
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
      options.dependencies[name] = getStringifyOptions(tree, compileOptions, options)
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
    .then(rawContents => {
      const info = ts.preProcessFile(rawContents)
      const { tree, ambient, cwd, browser, name, files, meta } = options
      const ambientModules = info.ambientExternalModules || []

      // Skip output of lib files.
      if (info.isLibFile) {
        return
      }

      if (ambientModules.length && !ambient) {
        return Promise.reject(
          new TypeError(
            `Attempted to compile ${toDependencyPath(options)} as a ` +
            `dependency, but it contains ambient module declarations. Did ` +
            `you want to specify "--ambient" instead?`
          )
        )
      }

      const importedFiles = info.importedFiles.map(x => isModuleName(x.fileName) ? x.fileName : resolveFrom(path, x.fileName))

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
          const [dependencyName, dependencyPath] = getModuleNameParts(path)
          const moduleName = ambient ? dependencyName : `${name}${SEPARATOR}${dependencyName}`
          const compileOptions = { cwd, browser, files, name: moduleName, ambient: false, meta }
          const stringifyOptions = cachedStringifyOptions(dependencyName, compileOptions, options)

          // When no options are returned, the dependency is missing.
          if (!stringifyOptions) {
            return
          }

          return compileDependencyPath(dependencyPath, stringifyOptions)
        }

        return stringifyDependencyPath(path, options)
      })

      return Promise.all(imports)
        .then(files => {
          const stringifyOptions = extend(options, { originalPath: path })
          const contents = rawContents.replace(REFERENCE_REGEXP, '')

          files.push(stringifyFile(definitionPath, contents, stringifyOptions))

          // Filter skipped dependencies.
          return files.filter(x => x != null).join(EOL + EOL)
        })
    })
}

/**
 * Separate the module name into pieces.
 */
function getModuleNameParts (moduleName: string): [string, string] {
  const parts = moduleName.split(/[\\\/]/)
  const dependencyName = parts.shift()
  const dependencyPath = parts.length === 0 ? null : parts.join('/')

  return [dependencyName, dependencyPath]
}

/**
 * Stringify a dependency file contents.
 */
function stringifyFile (path: string, contents: string, options: StringifyOptions & { originalPath: string }) {
  const sourceFile = ts.createSourceFile(path, contents, ts.ScriptTarget.Latest, true)
  const { tree, name, originalPath } = options

  // Output information for the original type source.
  const source = isHttp(path) ? path : relative(options.cwd, path)
  const prefix = options.meta ? `// Compiled using ${PROJECT_NAME}@${VERSION}${EOL}// Source: ${source}${EOL}` : ''

  // TODO(blakeembrey): Provide validation for ambient modules
  if (options.ambient) {
    if ((sourceFile as any).externalModuleIndicator) {
      throw new TypeError(
        `Attempted to compile ${toDependencyPath(options)} as an ambient ` +
        `module declaration, but it has external module indicators. Did you ` +
        `want to omit "--ambient"?`
      )
    }

    return prefix + contents.trim()
  }

  let isES6Export = true
  let wasDeclared = false

  // Stringify the import path to a namespaced import.
  function importPath (name: string) {
    if (isModuleName(name)) {
      const [moduleName] = getModuleNameParts(name)

      // If the dependency is not specified, **do not** transform - it's ambient.
      if (options.dependencies[moduleName] == null) {
        return name
      }

      return `${options.name}${SEPARATOR}${name}`
    }

    const relativePath = relativeTo(tree.src, resolveFrom(path, name))

    return normalizeSlashes(join(options.name, relativePath))
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
      const path = importPath((node as any).expression.text)

      return ` require('${path}')`
    }
  }

  // Read through the file.
  function read (start: number, end: number) {
    const text = sourceFile.text.slice(start, end)

    // Trim leading whitespace.
    if (start === 0) {
      return text.replace(/^\s+$/, '')
    }

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
  const isEntry = originalPath === options.entry

  // Direct usage of definition/typings. This is *not* a psuedo-module.
  if (isEntry && options.isTypings) {
    return prefix + declareText(name, moduleText)
  }

  const moduleName = `${name}/${normalizeSlashes(relativeTo(tree.src, fromDefinition(path)))}`
  const declared = declareText(moduleName, moduleText)

  if (!isEntry) {
    return prefix + declared
  }

  const importText = isES6Export ?
    `export * from '${moduleName}';` :
    `import main = require('${moduleName}');${EOL}export = main;`

  return prefix + declared + EOL + declareText(name, importText)
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
function processTree (
  sourceFile: ts.SourceFile,
  replacer: (node: ts.Node) => string,
  reader: (start: number, end?: number) => string
): string {
  let code = ''
  let position = 0

  function skip (node: ts.Node) {
    position = node.end
  }

  function readThrough (node: ts.Node) {
    code += reader(position, node.pos)
    position = node.pos
  }

  function visit (node: ts.Node) {
    readThrough(node)

    const replacement = replacer(node)

    if (replacement != null) {
      code += replacement
      skip(node)
    } else {
      ts.forEachChild(node, visit)
    }
  }

  visit(sourceFile)

  code += reader(position)

  return code
}

/**
 * Stringify the dependency path to something useful in the error.
 */
function toDependencyPath (options: StringifyOptions) {
  const parts: string[] = []
  let node = options

  do {
    parts.unshift(node.name)
  } while (node = node.parent)

  return parts.join(SEPARATOR)
}
