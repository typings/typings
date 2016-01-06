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
import { PROJECT_NAME, CONFIG_FILE, DEPENDENCY_SEPARATOR } from '../utils/config'
import { resolveDependency } from '../utils/parse'
import { VERSION } from '../typings'
import TypingsError from './error'

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
 * References collected by compilation.
 */
interface Reference {
  path: string
  raw: string
  src: string
  name: string
}

/**
 * The result of compiling a dependency tree.
 */
interface CompiledResult {
  contents: string
  references: Reference[]
  missing: Reference[]
}

/**
 * Compiled reference map with usages.
 */
export interface ReferenceMap {
  [path: string]: Array<{ name: string; main: boolean; browser: boolean }>
}

/**
 * The compiled output data.
 */
export interface CompiledOutput {
  tree: DependencyTree
  main: string
  browser: string
  references: ReferenceMap
  missing: ReferenceMap
}

/**
 * Compile a dependency tree using a root name.
 */
export default function compile (tree: DependencyTree, options: Options): Promise<CompiledOutput> {
  const files: ts.Map<Promise<string>> = {}

  return Promise.all([
    compileDependencyTree(tree, extend(options, { browser: false, files })),
    compileDependencyTree(tree, extend(options, { browser: true, files }))
  ])
    .then(([main, browser]) => {
      return {
        tree,
        main: main.contents,
        browser: browser.contents,
        references: mergeReferences(main.references, browser.references, true),
        missing: mergeReferences(main.missing, browser.missing, false)
      }
    })
}

/**
 * Create a reference map with the original sources.
 */
function mergeReferences (main: Reference[], browser: Reference[], isPaths: boolean): ReferenceMap {
  const map: ReferenceMap = {}

  // Add each entry to the map, deduping as we go.
  function addEntry (entry: Reference, browser: boolean) {
    const { path, raw, src, name } = entry
    let location: string

    if (isPaths) {
      location = resolveDependency(raw, relativeTo(src, path))
    } else {
      location = path
    }

    const values = map[location] || (map[location] = [])

    for (const value of values) {
      if (value.name === name) {
        // Set "browser" or "main" flags.
        if (browser) {
          value.browser = true
        } else {
          value.main = true
        }

        return
      }
    }

    values.push({
      name,
      main: !browser,
      browser
    })
  }

  for (const entry of main) {
    addEntry(entry, false)
  }

  for (const entry of browser) {
    addEntry(entry, true)
  }

  return map
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
  const entry = main == null ? main : resolveFrom(tree.src, normalizeToDefinition(main))

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
function compileDependencyTree (tree: DependencyTree, options: CompileOptions): Promise<CompiledResult> {
  return compileDependencyPath(null, getStringifyOptions(tree, options, undefined))
}

/**
 * Compile a dependency for a path, with pre-created stringify options.
 */
function compileDependencyPath (path: string, options: StringifyOptions): Promise<CompiledResult> {
  const { tree, entry } = options

  // Fallback to resolving the entry file.
  if (path == null) {
    if (entry == null) {
      return Promise.reject(new TypingsError(
        `Unable to resolve entry ".d.ts" file for "${options.name}", ` +
        'please make sure the module has a main or typings field'
      ))
    }

    return stringifyDependencyPath(resolveFrom(tree.src, entry), options)
  }

  return stringifyDependencyPath(resolveFrom(tree.src, path), options)
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
function stringifyDependencyPath (path: string, options: StringifyOptions): Promise<CompiledResult> {
  let definitionPath = normalizeToDefinition(path)
  const { tree, ambient, cwd, browser, name, files, meta, entry } = options

  if (has(options.overrides, definitionPath)) {
    definitionPath = options.overrides[definitionPath]
  }

  return cachedReadFileFrom(definitionPath, options)
    .then(
      function (rawContents) {
        const info = ts.preProcessFile(rawContents)
        const ambientModules = info.ambientExternalModules || []

        // Skip output of lib files.
        if (info.isLibFile) {
          return
        }

        if (ambientModules.length && !ambient) {
          return Promise.reject(new TypingsError(
            `Attempted to compile "${options.name}" as a dependency, but ` +
            `it contains ambient modules (${ambientModules.map(JSON.stringify).join(', ')}). ` +
            `Did you want to specify "--ambient" instead?`
          ))
        }

        const importedFiles = info.importedFiles.map(x => isModuleName(x.fileName) ? x.fileName : resolveFrom(path, x.fileName))
        const referencedFiles = info.referencedFiles.map(x => resolveFrom(path, x.fileName))
        const missingDependencies: string[] = []

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
            const moduleName = ambient ? dependencyName : `${name}${DEPENDENCY_SEPARATOR}${dependencyName}`
            const compileOptions = { cwd, browser, files, name: moduleName, ambient: false, meta }
            const stringifyOptions = cachedStringifyOptions(dependencyName, compileOptions, options)

            // When no options are returned, the dependency is missing.
            if (!stringifyOptions) {
              if (missingDependencies.indexOf(path) === -1) {
                missingDependencies.push(path)
              }

              return
            }

            return compileDependencyPath(dependencyPath, stringifyOptions)
          }

          return stringifyDependencyPath(path, options)
        })

        return Promise.all(imports)
          .then<CompiledResult>(imports => {
            const stringifyOptions = extend(options, { originalPath: path })
            const stringified = stringifyFile(definitionPath, rawContents, stringifyOptions)
            const { raw, src } = tree

            let references = referencedFiles.map(path => ({ name, path, raw, src }))
            let missing = missingDependencies.map(path => ({ name, path, raw, src }))
            let contents: string[] = []

            for (const imported of imports) {
              // Some dependencies and imports are skipped.
              if (imported) {
                references = references.concat(imported.references)
                missing = missing.concat(imported.missing)
                contents.push(imported.contents)
              }
            }

            // Push the current file at the end of the contents.
            // This builds the stringified file with dependencies first.
            contents.push(stringified)

            return {
              contents: contents.join(EOL + EOL),
              references,
              missing
            }
          })
      },
      function (cause) {
        const authorPhrase = options.parent ? `The author of "${options.parent.name}" needs to` : 'You should'
        const relativePath = relativeTo(tree.src, path)

        // Provide better errors for the entry path.
        if (path === entry) {
          return Promise.reject(new TypingsError(
            `Unable to read typings for "${options.name}". ` +
            `${authorPhrase} check the path is correct`,
            cause
          ))
        }

        return Promise.reject(new TypingsError(
          `Unable to read "${relativePath}" from "${options.name}". ` +
          `${authorPhrase} check the entry in "${CONFIG_FILE}" is complete`,
          cause
        ))
      }
    )
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
function stringifyFile (path: string, rawContents: string, options: StringifyOptions & { originalPath: string }) {
  const contents = rawContents.replace(REFERENCE_REGEXP, '')
  const sourceFile = ts.createSourceFile(path, contents, ts.ScriptTarget.Latest, true)
  const { tree, name, originalPath } = options

  // Output information for the original type source.
  const source = isHttp(path) ? path : relative(options.cwd, path)
  const prefix = options.meta ? `// Compiled using ${PROJECT_NAME}@${VERSION}${EOL}// Source: ${source}${EOL}` : ''

  // TODO(blakeembrey): Provide validation for ambient modules
  if (options.ambient) {
    if ((sourceFile as any).externalModuleIndicator) {
      throw new TypingsError(
        `Attempted to compile ${options.name} as an ambient ` +
        `module declaration, but it has external module indicators. Did you ` +
        `want to omit "--ambient"?`
      )
    }

    return `${prefix}${contents.trim()}`
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

      return `${options.name}${DEPENDENCY_SEPARATOR}${name}`
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
