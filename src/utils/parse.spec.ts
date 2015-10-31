import test = require('blue-tape')
import { normalize } from 'path'
import { parseDependency } from './parse'
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
        location: normalize('foobar/' + CONFIG_FILE)
      }

      t.deepEqual(actual, expected)
      t.end()
    })

    t.test('parse github', t => {
      const actual = parseDependency('github:foo/bar')
      const expected = {
        raw: 'github:foo/bar',
        type: 'hosted',
        location: 'https://raw.githubusercontent.com/foo/bar/master/' + CONFIG_FILE
      }

      t.deepEqual(actual, expected)
      t.end()
    })

    t.test('parse github with she and append `` + CONFIG_FILE', t => {
      const actual = parseDependency('github:foo/bar#test')
      const expected = {
        raw: 'github:foo/bar#test',
        type: 'hosted',
        location: 'https://raw.githubusercontent.com/foo/bar/test/' + CONFIG_FILE
      }

      t.deepEqual(actual, expected)
      t.end()
    })

    t.test('parse github paths to `.d.ts` files', t => {
      const actual = parseDependency('github:foo/bar/typings/file.d.ts')
      const expected = {
        raw: 'github:foo/bar/typings/file.d.ts',
        type: 'hosted',
        location: 'https://raw.githubusercontent.com/foo/bar/master/typings/file.d.ts'
      }

      t.deepEqual(actual, expected)
      t.end()
    })

    t.test('parse github paths to `` + CONFIG_FILE', t => {
      const actual = parseDependency('github:foo/bar/src/' + CONFIG_FILE)
      const expected = {
        raw: 'github:foo/bar/src/' + CONFIG_FILE,
        type: 'hosted',
        location: 'https://raw.githubusercontent.com/foo/bar/master/src/' + CONFIG_FILE
      }

      t.deepEqual(actual, expected)
      t.end()
    })

    t.test('parse bitbucket', t => {
      const actual = parseDependency('bitbucket:foo/bar')
      const expected = {
        raw: 'bitbucket:foo/bar',
        type: 'hosted',
        location: 'https://bitbucket.org/foo/bar/raw/master/' + CONFIG_FILE
      }

      t.deepEqual(actual, expected)
      t.end()
    })

    t.test('parse bitbucket and append `` + CONFIG_FILE to path', t => {
      const actual = parseDependency('bitbucket:foo/bar/dir')
      const expected = {
        raw: 'bitbucket:foo/bar/dir',
        type: 'hosted',
        location: 'https://bitbucket.org/foo/bar/raw/master/dir/' + CONFIG_FILE
      }

      t.deepEqual(actual, expected)
      t.end()
    })

    t.test('parse bitbucket with sha', t => {
      const actual = parseDependency('bitbucket:foo/bar#abc')
      const expected = {
        raw: 'bitbucket:foo/bar#abc',
        type: 'hosted',
        location: 'https://bitbucket.org/foo/bar/raw/abc/' + CONFIG_FILE
      }

      t.deepEqual(actual, expected)
      t.end()
    })

    t.test('parse url', t => {
      const actual = parseDependency('http://example.com/foo/' + CONFIG_FILE)
      const expected = {
        raw: 'http://example.com/foo/' + CONFIG_FILE,
        type: 'hosted',
        location: 'http://example.com/foo/' + CONFIG_FILE
      }

      t.deepEqual(actual, expected)
      t.end()
    })

    t.test('unsupported scheme', t => {
      t.throws(() => parseDependency('random:fake/dep'), /Unsupported dependency/)
      t.end()
    })
  })
})
