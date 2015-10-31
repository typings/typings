import test = require('blue-tape')
import { join } from 'path'
import resolveDependencies from './dependencies'
import { PROJECT_NAME } from '../utils/config'
import { DependencyTree, DependencyBranch } from '../interfaces/main'

const CACHE_PATH = join(__dirname, '.cache')
const RESOLVE_FIXTURE_DIR = join(__dirname, '__test__/fixtures/resolve')

test('dependencies', t => {
  t.test('resolve fixture', t => {
    t.test('resolve a dependency tree', t => {
      const expected: DependencyTree = {
        type: undefined,
        ambient: false,
        missing: false,
        name: undefined,
        src: undefined,
        main: undefined,
        browser: undefined,
        typings: undefined,
        browserTypings: undefined,
        dependencies: {},
        devDependencies: {},
        ambientDependencies: {}
      }

      const bowerDep: DependencyTree = {
        type: 'bower',
        ambient: false,
        missing: false,
        src: join(RESOLVE_FIXTURE_DIR, 'bower_components/bower-dep/bower.json'),
        typings: 'bower-dep.d.ts',
        browserTypings: undefined,
        dependencies: {},
        devDependencies: {},
        ambientDependencies: {},
        name: 'bower-dep',
        version: undefined,
        main: 'index.js',
        browser: undefined
      }

      const exampleDep: DependencyTree = {
        type: 'bower',
        ambient: false,
        missing: false,
        src: join(RESOLVE_FIXTURE_DIR, 'bower_components/example/bower.json'),
        main: undefined,
        browser: undefined,
        version: undefined,
        typings: undefined,
        browserTypings: undefined,
        name: 'example',
        dependencies: {},
        devDependencies: {},
        ambientDependencies: {}
      }

      const typedDep: DependencyTree = {
        type: PROJECT_NAME,
        ambient: false,
        missing: false,
        src: join(RESOLVE_FIXTURE_DIR, 'typings/dep.d.ts'),
        typings: join(RESOLVE_FIXTURE_DIR, 'typings/dep.d.ts'),
        dependencies: {},
        devDependencies: {},
        ambientDependencies: {}
      }

      // const githubDep: DependencyTree = {
      //   type: PROJECT_NAME,
      //   ambient: false,
      //   missing: true,
      //   src: 'https://raw.githubusercontent.com/foo/bar/master/typings.json',
      //   main: undefined,
      //   typings: {},
      //   dependencies: {},
      //   devDependencies: {},
      //   ambientDependencies: {}
      // }

      const npmDep: DependencyTree = {
        type: 'npm',
        ambient: false,
        missing: false,
        src: join(RESOLVE_FIXTURE_DIR, 'node_modules/npm-dep/package.json'),
        main: './index.js',
        browser: undefined,
        version: undefined,
        typings: undefined,
        browserTypings: undefined,
        name: 'npm-dep',
        dependencies: {},
        devDependencies: {},
        ambientDependencies: {}
      }

      const typedDevDep: DependencyTree = {
        type: 'bower',
        ambient: false,
        missing: true,
        src: join(RESOLVE_FIXTURE_DIR, 'bower_components/dep/bower.json'),
        dependencies: {},
        devDependencies: {},
        ambientDependencies: {}
      }

      ;(<any> expected).dependencies['bower-dep'] = bowerDep
      ;(<any> expected).dependencies['dep'] = typedDep
      // ;(<any> expected).dependencies['github-dep'] = githubDep
      ;(<any> expected).dependencies['npm-dep'] = npmDep
      ;(<any> expected).devDependencies['dev-dep'] = typedDevDep

      ;(<any> bowerDep).dependencies['example'] = exampleDep

      return resolveDependencies({
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
