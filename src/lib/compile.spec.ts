import test = require('blue-tape')
import { EOL } from 'os'
import { join } from 'path'
import compile from './compile'
import { DependencyTree } from '../interfaces/main'
import { PROJECT_NAME, CONFIG_FILE } from '../utils/config'

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
        main: join(FIXTURE_DIR, 'root'),
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
        typings: join(FIXTURE_DIR, 'a/typed.d.ts'),
        browserTypings: join(FIXTURE_DIR, 'a/typed.browser.d.ts'),
        dependencies: {},
        devDependencies: {},
        ambientDependencies: {}
      }

      const b: DependencyTree = {
        type: PROJECT_NAME,
        src: __filename,
        missing: false,
        ambient: false,
        main: undefined,
        typings: join(FIXTURE_DIR, 'typings/b.d.ts'),
        dependencies: {},
        devDependencies: {},
        ambientDependencies: {}
      }

      const browser: DependencyTree = {
        type: PROJECT_NAME,
        src: __filename,
        missing: false,
        ambient: false,
        main: undefined,
        typings: join(FIXTURE_DIR, 'browser.d.ts'),
        dependencies: {},
        devDependencies: {},
        ambientDependencies: {}
      }

      const dep: DependencyTree = {
        type: PROJECT_NAME,
        src: join(FIXTURE_DIR, `dep/${CONFIG_FILE}`),
        missing: false,
        ambient: false,
        main: join(FIXTURE_DIR, 'dep/main.d.ts'),
        dependencies: {},
        devDependencies: {},
        ambientDependencies: {}
      }

      ;(<any> root).dependencies.a = a
      ;(<any> root).dependencies.b = b
      ;(<any> root).dependencies.dep = dep
      ;(<any> root).dependencies.browser = browser

      return compile(root, { name: 'root', cwd: __dirname, ambient: false })
        .then((result) => {
          t.equal(result.main, [
            'declare module \'root!a\' {',
            'export interface ITest {',
            '  foo: string',
            '  bar: boolean',
            '}',
            'export default function (): ITest',
            '}',
            'declare module \'root!b\' {',
            'export const foo: number',
            '}',
            'declare module \'root!dep/path\' {',
            'export const isDep: boolean',
            '}',
            'declare module \'root/root-import\' {',
            'export const test: string',
            '}',
            'declare module \'root/root\' {',
            'import a from \'root!a\'',
            'import b = require(\'root!b\')',
            'import { isDep } from \'root!dep/path\'',
            'export * from \'root/root-import\'',
            '}',
            'declare module \'root\' {',
            'export * from \'root/root\';',
            '}'
          ].join(EOL))

          t.equal(result.browser, [
            'declare module \'root!a\' {',
            'export function browser (): boolean',
            '}',
            'declare module \'root!b\' {',
            'export const bar: boolean',
            '}',
            'declare module \'root!dep/path\' {',
            'export const isDep: boolean',
            '}',
            'declare module \'root/root-import\' {',
            'export const test: string',
            '}',
            'declare module \'root/root\' {',
            'import a from \'root!a\'',
            'import b = require(\'root!b\')',
            'import { isDep } from \'root!dep/path\'',
            'export * from \'root/root-import\'',
            '}',
            'declare module \'root\' {',
            'export * from \'root/root\';',
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

      ;(<any> node).dependencies.fs = fs

      return compile(node, { name: 'name', cwd: __dirname, ambient: true })
        .then(result => {
          t.equal(result.main, [
            'declare module \'fs\' {',
            'export function readFileSync (path: string, encoding: string): string',
            'export function readFileSync (path: string): Buffer',
            '}',
            'declare var __dirname: string'
          ].join(EOL))
        })
    })
  })
})
