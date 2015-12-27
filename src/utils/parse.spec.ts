import test = require('blue-tape')
import { normalize } from 'path'
import { parseDependency, resolveDependency, inferDependencyName } from './parse'
import { CONFIG_FILE } from './config'

test('parse', t => {
  t.test('parse dependency', t => {
    t.test('parse filename', t => {
      const actual = parseDependency('file:./foo/bar.d.ts')
      const expected = {
        raw: 'file:./foo/bar.d.ts',
        location: normalize('foo/bar.d.ts'),
        type: 'file'
      }

      t.deepEqual(actual, expected)
      t.end()
    })

    t.test('parse filename relative', t => {
      const actual = parseDependency('file:foo/bar.d.ts')
      const expected = {
        raw: 'file:foo/bar.d.ts',
        location: normalize('foo/bar.d.ts'),
        type: 'file'
      }

      t.deepEqual(actual, expected)
      t.end()
    })

    t.test('parse npm', t => {
      const actual = parseDependency('npm:foobar')
      const expected = {
        raw: 'npm:foobar',
        type: 'npm',
        meta: {
          name: 'foobar',
          path: 'package.json'
        },
        location: normalize('foobar/package.json')
      }

      t.deepEqual(actual, expected)
      t.end()
    })

    t.test('parse scoped npm packages', t => {
      const actual = parseDependency('npm:@foo/bar')
      const expected = {
        raw: 'npm:@foo/bar',
        type: 'npm',
        meta: {
          name: '@foo/bar',
          path: 'package.json'
        },
        location: normalize('@foo/bar/package.json')
      }

      t.deepEqual(actual, expected)
      t.end()
    })

    t.test('parse npm filename', t => {
      const actual = parseDependency('npm:typescript/bin/lib.es6.d.ts')
      const expected = {
        raw: 'npm:typescript/bin/lib.es6.d.ts',
        type: 'npm',
        meta: {
          name: 'typescript',
          path: normalize('bin/lib.es6.d.ts')
        },
        location: normalize('typescript/bin/lib.es6.d.ts')
      }

      t.deepEqual(actual, expected)
      t.end()
    })

    t.test('parse bower', t => {
      const actual = parseDependency('bower:foobar')
      const expected = {
        raw: 'bower:foobar',
        type: 'bower',
        meta: {
          name: 'foobar',
          path: 'bower.json'
        },
        location: normalize('foobar/bower.json')
      }

      t.deepEqual(actual, expected)
      t.end()
    })

    t.test('parse bower filename', t => {
      const actual = parseDependency('bower:foobar/' + CONFIG_FILE)
      const expected = {
        raw: 'bower:foobar/' + CONFIG_FILE,
        type: 'bower',
        meta: {
          name: 'foobar',
          path: 'typings.json'
        },
        location: normalize('foobar/' + CONFIG_FILE)
      }

      t.deepEqual(actual, expected)
      t.end()
    })

    t.test('parse github', t => {
      const actual = parseDependency('github:foo/bar')
      const expected = {
        raw: 'github:foo/bar',
        type: 'github',
        meta: {
          org: 'foo',
          path: 'typings.json',
          repo: 'bar',
          sha: 'master'
        },
        location: 'https://raw.githubusercontent.com/foo/bar/master/' + CONFIG_FILE
      }

      t.deepEqual(actual, expected)
      t.end()
    })

    t.test('parse github with sha and append config file', t => {
      const actual = parseDependency('github:foo/bar#test')
      const expected = {
        raw: 'github:foo/bar#test',
        type: 'github',
        meta: {
          org: 'foo',
          path: 'typings.json',
          repo: 'bar',
          sha: 'test'
        },
        location: 'https://raw.githubusercontent.com/foo/bar/test/' + CONFIG_FILE
      }

      t.deepEqual(actual, expected)
      t.end()
    })

    t.test('parse github paths to `.d.ts` files', t => {
      const actual = parseDependency('github:foo/bar/typings/file.d.ts')
      const expected = {
        raw: 'github:foo/bar/typings/file.d.ts',
        type: 'github',
        meta: {
          org: 'foo',
          path: 'typings/file.d.ts',
          repo: 'bar',
          sha: 'master'
        },
        location: 'https://raw.githubusercontent.com/foo/bar/master/typings/file.d.ts'
      }

      t.deepEqual(actual, expected)
      t.end()
    })

    t.test('parse github paths to config file', t => {
      const actual = parseDependency('github:foo/bar/src/' + CONFIG_FILE)
      const expected = {
        raw: 'github:foo/bar/src/' + CONFIG_FILE,
        type: 'github',
        meta: {
          org: 'foo',
          path: 'src/typings.json',
          repo: 'bar',
          sha: 'master'
        },
        location: 'https://raw.githubusercontent.com/foo/bar/master/src/' + CONFIG_FILE
      }

      t.deepEqual(actual, expected)
      t.end()
    })

    t.test('parse bitbucket', t => {
      const actual = parseDependency('bitbucket:foo/bar')
      const expected = {
        raw: 'bitbucket:foo/bar',
        type: 'bitbucket',
        meta: {
          org: 'foo',
          path: 'typings.json',
          repo: 'bar',
          sha: 'master'
        },
        location: 'https://bitbucket.org/foo/bar/raw/master/' + CONFIG_FILE
      }

      t.deepEqual(actual, expected)
      t.end()
    })

    t.test('parse bitbucket and append config file to path', t => {
      const actual = parseDependency('bitbucket:foo/bar/dir')
      const expected = {
        raw: 'bitbucket:foo/bar/dir',
        type: 'bitbucket',
        meta: {
          org: 'foo',
          path: 'dir/typings.json',
          repo: 'bar',
          sha: 'master'
        },
        location: 'https://bitbucket.org/foo/bar/raw/master/dir/' + CONFIG_FILE
      }

      t.deepEqual(actual, expected)
      t.end()
    })

    t.test('parse bitbucket with sha', t => {
      const actual = parseDependency('bitbucket:foo/bar#abc')
      const expected = {
        raw: 'bitbucket:foo/bar#abc',
        type: 'bitbucket',
        meta: {
          org: 'foo',
          path: 'typings.json',
          repo: 'bar',
          sha: 'abc'
        },
        location: 'https://bitbucket.org/foo/bar/raw/abc/' + CONFIG_FILE
      }

      t.deepEqual(actual, expected)
      t.end()
    })

    t.test('parse url', t => {
      const actual = parseDependency('http://example.com/foo/' + CONFIG_FILE)
      const expected = {
        raw: 'http://example.com/foo/' + CONFIG_FILE,
        type: 'http',
        location: 'http://example.com/foo/' + CONFIG_FILE
      }

      t.deepEqual(actual, expected)
      t.end()
    })

    t.test('unknown scheme', t => {
      t.throws(() => parseDependency('random:fake/dep'), /Unknown dependency: /)
      t.end()
    })
  })

  t.test('resolve dependency', t => {
    t.equal(resolveDependency('github:foo/bar/baz/x.d.ts', '../lib/test.d.ts'), 'github:foo/bar/lib/test.d.ts')
    t.equal(resolveDependency('http://example.com/foo/bar.d.ts', 'x.d.ts'), 'http://example.com/foo/x.d.ts')

    t.end()
  })

  t.test('infer dependency name', t => {
    t.equal(inferDependencyName('github:foo/bar'), 'bar')
    t.equal(inferDependencyName('npm:@scoped/package'), '@scoped/package')
    t.equal(inferDependencyName('bower:dependency/path/to/type.d.ts'), 'dependency')
    t.equal(inferDependencyName('github:a/b/c/d.d.ts'), 'd')
    t.equal(inferDependencyName('github:typings/typed-debug'), 'debug')

    t.end()
  })
})
