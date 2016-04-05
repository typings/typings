# Typings, The Registry and Versions

Typings supports multiple versions of type definitions for **different versions** of a single library.

In contrast, TSD was bound to Definitely Typed which officially only supports the latest and greatest type definitions. Installation of older type definitions with TSD relied on the user knowing an unmemorable SHA hash. Also, there was no way for older type definitions to continue to be evolved side by side with existing typings.

Typings does not have these limitations as it uses a [dedicated registry](https://github.com/typings/registry), where each library is defined in JSON with the ability to have multiple versions.  Let's take a look at the Typing Registry's [Moment's](http://momentjs.com/) [`moment.json`](https://github.com/typings/registry/blob/master/npm/moment.json):

```json
{
  "versions": {
    "2.10.5": "github:typed-typings/npm-moment#a4075cd50e63efbedd850f654594f293ab81a385"
  }
}
```

As you can see, this file contains reference to a single version of Moment's type definition: [version 2.10.5](https://github.com/moment/moment/blob/develop/CHANGELOG.md#2105-see-full-changelog).  Let's imagine I'm working on a project which is using [Moment version 1.7.0](https://github.com/moment/moment/blob/develop/CHANGELOG.md#170-see-discussion).  The `2.10.5` definition is no good for me.  I need `1.7.0`.  What to do?

Well if some kind soul writes a Moment type definition version `1.7.0`, then the registry could be updated to reference it. It'd end up looking a little like this:

```json
{
  "versions": {
    "1.7.0": "github:some-kind-soul/moment-1-7-0-typing#iamahash1iamahash1iamahash1",
    "2.10.5": "github:typed-typings/npm-moment#a4075cd50e63efbedd850f654594f293ab81a385"
  }
}
```

To install this type definition you'd enter: `typings install moment@1.7.0`.  This would bring down the `1.7.0` definition instead of the `2.10.5` one.  (Incidentally executing the same commmand but without the `@version.number` would bring down the latest and greatest version of the `moment` type definitions, as you might expect.)

Over time it's more likely that all the versions of a type definition will be driven off a single repo.  This repo will evolve in line with the package it provides type definitions for.  In this scenario a Typings Registry JSON file will point back to the same type definition but with different versions effectively aliasing SHA hashes.  So something like this might be plausible:

```json
{
  "versions": {
    "2.10.5": "github:typed-typings/npm-moment#a4075cd50e63efbedd850f654594f293ab81a385",
    "3.0.0": "github:typed-typings/npm-moment#iamafuturehash1iamafuturehash1iamafuturehash1"
  }
}
```
