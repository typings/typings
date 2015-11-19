import test = require('blue-tape')
import nock = require('nock')
import { EOL } from 'os'
import { join, relative } from 'path'
import compile from './compile'
import { DependencyTree } from '../interfaces/main'
import { PROJECT_NAME, CONFIG_FILE } from '../utils/config'
import { VERSION } from '../typings'

const FIXTURES_DIR = join(__dirname, '__test__/fixtures')

test('compile', t => {
  t.test('fixtures', t => {
    t.test('compile a normal definition', t => {
      const FIXTURE_DIR = join(FIXTURES_DIR, 'compile')

      const root: DependencyTree = {
        type: PROJECT_NAME,
        src: join(FIXTURE_DIR, CONFIG_FILE),
        missing: false,
        ambient: false,
        main: 'root',
        browser: {
          b: 'browser'
        },
        dependencies: {},
        devDependencies: {},
        ambientDependencies: {}
      }

      const a: DependencyTree = {
        type: PROJECT_NAME,
        src: join(FIXTURE_DIR, `a/${CONFIG_FILE}`),
        missing: false,
        ambient: false,
        main: undefined,
        typings: 'typed.d.ts',
        browserTypings: 'typed.browser.d.ts',
        dependencies: {},
        devDependencies: {},
        ambientDependencies: {}
      }

      const b: DependencyTree = {
        type: PROJECT_NAME,
        src: join(FIXTURE_DIR, 'bower.json'),
        missing: false,
        ambient: false,
        main: undefined,
        typings: 'typings/b.d.ts',
        dependencies: {},
        devDependencies: {},
        ambientDependencies: {}
      }

      const browser: DependencyTree = {
        type: PROJECT_NAME,
        src: join(FIXTURE_DIR, 'package.json'),
        missing: false,
        ambient: false,
        main: undefined,
        typings: 'browser.d.ts',
        dependencies: {},
        devDependencies: {},
        ambientDependencies: {}
      }

      const dep: DependencyTree = {
        type: PROJECT_NAME,
        src: join(FIXTURE_DIR, `dep/${CONFIG_FILE}`),
        missing: false,
        ambient: false,
        main: 'dep/main.d.ts',
        dependencies: {},
        devDependencies: {},
        ambientDependencies: {}
      }

      ;(root as any).dependencies.a = a
      ;(root as any).dependencies.b = b
      ;(root as any).dependencies.dep = dep
      ;(root as any).dependencies.browser = browser

      return compile(root, { name: 'root', cwd: __dirname, ambient: false, meta: true })
        .then((result) => {
          t.equal(result.main, [
            `// Compiled using typings@${VERSION}`,
            `// Source: ${relative(__dirname, join(FIXTURE_DIR, 'a/typed.d.ts'))}`,
            'declare module \'root~a\' {',
            '  export interface ITest {',
            '    foo: string',
            '    bar: boolean',
            '  }',
            '  export default function (): ITest',
            '}',
            '',
            `// Compiled using typings@${VERSION}`,
            `// Source: ${relative(__dirname, join(FIXTURE_DIR, 'typings/b.d.ts'))}`,
            'declare module \'root~b\' {',
            '  export const foo: number',
            '}',
            '',
            `// Compiled using typings@${VERSION}`,
            `// Source: ${relative(__dirname, join(FIXTURE_DIR, 'dep/path.d.ts'))}`,
            'declare module \'root~dep/path\' {',
            '  export const isDep: boolean',
            '}',
            '',
            `// Compiled using typings@${VERSION}`,
            `// Source: ${relative(__dirname, join(FIXTURE_DIR, 'root-import.d.ts'))}`,
            'declare module \'root/root-import\' {',
            '  export const test: string',
            '}',
            '',
            `// Compiled using typings@${VERSION}`,
            `// Source: ${relative(__dirname, join(FIXTURE_DIR, 'root.d.ts'))}`,
            'declare module \'root/root\' {',
            '  import a from \'root~a\'',
            '  import b = require(\'root~b\')',
            '  import { isDep } from \'root~dep/path\'',
            '  export * from \'root/root-import\'',
            '}',
            'declare module \'root\' {',
            '  export * from \'root/root\';',
            '}'
          ].join(EOL))

          t.equal(result.browser, [
            `// Compiled using typings@${VERSION}`,
            `// Source: ${relative(__dirname, join(FIXTURE_DIR, 'a/typed.browser.d.ts'))}`,
            'declare module \'root~a\' {',
            '  export function browser(): boolean',
            '}',
            '',
            `// Compiled using typings@${VERSION}`,
            `// Source: ${relative(__dirname, join(FIXTURE_DIR, 'browser.d.ts'))}`,
            'declare module \'root~b\' {',
            '  export const bar: boolean',
            '}',
            '',
            `// Compiled using typings@${VERSION}`,
            `// Source: ${relative(__dirname, join(FIXTURE_DIR, 'dep/path.d.ts'))}`,
            'declare module \'root~dep/path\' {',
            '  export const isDep: boolean',
            '}',
            '',
            `// Compiled using typings@${VERSION}`,
            `// Source: ${relative(__dirname, join(FIXTURE_DIR, 'root-import.d.ts'))}`,
            'declare module \'root/root-import\' {',
            '  export const test: string',
            '}',
            '',
            `// Compiled using typings@${VERSION}`,
            `// Source: ${relative(__dirname, join(FIXTURE_DIR, 'root.d.ts'))}`,
            'declare module \'root/root\' {',
            '  import a from \'root~a\'',
            '  import b = require(\'root~b\')',
            '  import { isDep } from \'root~dep/path\'',
            '  export * from \'root/root-import\'',
            '}',
            'declare module \'root\' {',
            '  export * from \'root/root\';',
            '}'
          ].join(EOL))
        })
    })

    t.test('compile export equals', t => {
      const FIXTURE_DIR = join(FIXTURES_DIR, 'compile-export-equals')

      const file: DependencyTree = {
        type: PROJECT_NAME,
        src: join(FIXTURE_DIR, CONFIG_FILE),
        missing: false,
        ambient: false,
        main: 'file.d.ts',
        dependencies: {},
        devDependencies: {},
        ambientDependencies: {}
      }

      return compile(file, { name: 'foobar', cwd: __dirname, ambient: false, meta: false })
        .then(results => {
          t.equal(results.main, [
            'declare module \'foobar/file\' {',
            '  function foo(value: string): foo.Bar;',
            '',
            '  module foo {',
            '    export interface Bar {',
            '      (message: any, ...args: any[]): void;',
            '      enabled: boolean;',
            '      namespace: string;',
            '    }',
            '  }',
            '',
            '  export = foo;',
            '}',
            'declare module \'foobar\' {',
            '  import main = require(\'foobar/file\');',
            '  export = main;',
            '}'
          ].join(EOL))
        })
    })

    t.test('compile an ambient definition', t => {
      const FIXTURE_DIR = join(FIXTURES_DIR, 'compile-ambient')

      const node: DependencyTree = {
        type: PROJECT_NAME,
        src: __filename,
        missing: false,
        ambient: true,
        typings: join(FIXTURE_DIR, 'node.d.ts'),
        dependencies: {},
        devDependencies: {},
        ambientDependencies: {}
      }

      const fs: DependencyTree = {
        type: PROJECT_NAME,
        src: join(FIXTURE_DIR, 'fs.d.ts'),
        missing: false,
        ambient: false,
        main: undefined,
        typings: join(FIXTURE_DIR, 'fs.d.ts'),
        dependencies: {},
        devDependencies: {},
        ambientDependencies: {}
      }

      ;(node as any).dependencies.fs = fs

      return compile(node, { name: 'name', cwd: __dirname, ambient: true, meta: false })
        .then(result => {
          t.equal(result.main, [
            'declare module \'fs\' {',
            '  export function readFileSync(path: string, encoding: string): string',
            '  export function readFileSync(path: string): Buffer',
            '}',
            '',
            'declare var __dirname: string'
          ].join(EOL))
        })
    })

    t.test('compile inline ambient definitions', t => {
      const FIXTURE_DIR = join(FIXTURES_DIR, 'compile-inline-ambient')
      const typings = join(FIXTURE_DIR, 'node.d.ts')

      const node: DependencyTree = {
        type: PROJECT_NAME,
        src: __filename,
        missing: false,
        ambient: true,
        typings,
        dependencies: {},
        devDependencies: {},
        ambientDependencies: {}
      }

      return compile(node, { name: 'name', cwd: __dirname, ambient: true, meta: true })
        .then(result => {
          const contents = [
            `// Compiled using typings@${VERSION}`,
            `// Source: ${relative(__dirname, typings)}`,
            'declare const require: (module: string) => any;',
            '',
            'declare module "events" {',
            '  export const test: boolean;',
            '}',
            '',
            'declare module "fs" {',
            '  import * as events from "events";',
            '}'
          ].join(EOL)

          t.equal(result.main, contents)
          t.equal(result.browser, contents)
        })
    })
  })

  t.test('missing error', t => {
    const node: DependencyTree = {
      type: PROJECT_NAME,
      src: 'http://example.com/typings/index.d.ts',
      missing: true,
      ambient: false,
      typings: 'http://example.com/typings/index.d.ts',
      dependencies: {},
      devDependencies: {},
      ambientDependencies: {}
    }

    t.plan(1)

    return compile(node, { name: 'test', cwd: __dirname, ambient: false, meta: false })
      .catch(function (result) {
        t.equal(result.message, 'Missing dependency "test", unable to compile dependency tree')
      })
  })

  t.test('resolve over http', t => {
    const node: DependencyTree = {
      type: PROJECT_NAME,
      src: 'http://example.com/typings.json',
      missing: false,
      ambient: false,
      typings: 'http://example.com/index.d.ts',
      dependencies: {},
      devDependencies: {},
      ambientDependencies: {}
    }

    nock('http://example.com')
      .get('/typings.json')
      .reply(200, '{"main":"index.d.ts"}')

      nock('http://example.com')
        .get('/index.d.ts')
        .reply(200, 'export const helloWorld: string')

    return compile(node, { name: 'test', cwd: __dirname, ambient: false, meta: false })
      .then(function (result) {
        t.equal(result.main, "declare module 'test' {\n  export const helloWorld: string\n}")
      })
  })
})
