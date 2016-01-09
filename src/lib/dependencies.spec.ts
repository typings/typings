import test = require('blue-tape')
import { join } from 'path'
import { resolveAllDependencies } from './dependencies'
import { DependencyTree, DependencyBranch } from '../interfaces/main'

const RESOLVE_FIXTURE_DIR = join(__dirname, '__test__/fixtures/resolve')

test('dependencies', t => {
  t.test('resolve fixture', t => {
    t.test('resolve a dependency tree', t => {
      const expected: DependencyTree = {
        raw: undefined,
        name: 'foobar',
        src: join(RESOLVE_FIXTURE_DIR, 'package.json'),
        main: 'index.js',
        browser: undefined,
        typings: undefined,
        browserTypings: undefined,
        dependencies: {},
        devDependencies: {},
        ambientDependencies: {},
        ambientDevDependencies: {}
      }

      const bowerDep: DependencyTree = {
        raw: 'bower:bower-dep',
        src: join(RESOLVE_FIXTURE_DIR, 'bower_components/bower-dep/bower.json'),
        typings: 'bower-dep.d.ts',
        browserTypings: undefined,
        dependencies: {},
        devDependencies: {},
        ambientDependencies: {},
        ambientDevDependencies: {},
        name: 'bower-dep',
        version: undefined,
        main: 'index.js',
        browser: undefined
      }

      const exampleDep: DependencyTree = {
        raw: 'bower:example',
        src: join(RESOLVE_FIXTURE_DIR, 'bower_components/example/bower.json'),
        main: undefined,
        browser: undefined,
        version: undefined,
        typings: undefined,
        browserTypings: undefined,
        name: 'example',
        dependencies: {},
        devDependencies: {},
        ambientDependencies: {},
        ambientDevDependencies: {}
      }

      const typedDep: DependencyTree = {
        raw: 'file:typings/dep.d.ts',
        src: join(RESOLVE_FIXTURE_DIR, 'typings/dep.d.ts'),
        typings: join(RESOLVE_FIXTURE_DIR, 'typings/dep.d.ts'),
        dependencies: {},
        devDependencies: {},
        ambientDependencies: {},
        ambientDevDependencies: {}
      }

      const npmDep: DependencyTree = {
        raw: 'npm:npm-dep',
        src: join(RESOLVE_FIXTURE_DIR, 'node_modules/npm-dep/package.json'),
        main: './index.js',
        browser: undefined,
        version: undefined,
        typings: undefined,
        browserTypings: undefined,
        name: 'npm-dep',
        dependencies: {},
        devDependencies: {},
        ambientDependencies: {},
        ambientDevDependencies: {}
      }

      const typedDevDep: DependencyTree = {
        ambientDependencies: {},
        ambientDevDependencies: {},
        browser: undefined,
        browserTypings: undefined,
        dependencies: {},
        devDependencies: {},
        main: undefined,
        name: 'dep',
        raw: 'bower:dep',
        src: join(RESOLVE_FIXTURE_DIR, 'bower_components/dep/bower.json'),
        typings: undefined,
        version: undefined
      }

      ;(expected as any).dependencies['bower-dep'] = bowerDep
      ;(expected as any).dependencies.dep = typedDep
      ;(expected as any).dependencies['npm-dep'] = npmDep
      ;(expected as any).devDependencies['dev-dep'] = typedDevDep

      ;(bowerDep as any).dependencies.example = exampleDep

      return resolveAllDependencies({
        cwd: RESOLVE_FIXTURE_DIR,
        dev: true
      })
        .then((result) => {
          function removeParentReferenceFromDependencies (dependencies: DependencyBranch) {
            Object.keys(dependencies).forEach(function (key) {
              removeParentReference(dependencies[key])
            })
          }

          function removeParentReference (tree: DependencyTree) {
            delete tree.parent

            removeParentReferenceFromDependencies(tree.dependencies)
            removeParentReferenceFromDependencies(tree.devDependencies)
            removeParentReferenceFromDependencies(tree.ambientDependencies)

            return tree
          }

          removeParentReference(result)

          t.deepEqual(result, expected)
        })
    })
  })
})
