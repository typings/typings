# How Typings Makes External Modules First Class

Often the best way to understand something is through example.  Let's imagine you're writing a web application using TypeScript and you decide you need to use jQuery.  With a flick of your wrist you `jspm install oldJ=jquery@1.6` to bring `jquery@1.6` into your environment as `oldJ`.  Why did you install it as `oldJ`?  You're quirky.

In your code you're then free to use jQuery as you like, for instance:

```ts
import * as littleOldJ from 'oldJ';
```

This statement inserts `littleOldJ` into the current scope, containing all the exported bindings from `'oldJ'` aka jQuery. I said you were quirky.

At this point you have jQuery in place but you're unable to make use of it in your TypeScript as jQuery does not ship with definitions in the box.  It has no `jquery.d.ts`.

Enter, stage left: Typings.

You can `typings install jquery@1.6 --name oldJ` and Typings will bring in the jQuery type definitions in a way that satisfies the TypeScript compiler.  Typings brings in the external module definition for jQuery and creates a local global version called `oldJ` which you can use in your project. (nb At the time of writing the [Typings Registry](https://github.com/typings/registry) does not contain a definition for jQuery; but that's only a matter of time.)

This workflow is **not possible** with TSD / DefinitelyTyped because DT contains definitions which are global **already**.

Still a little confused?  Stick with me; we'll step through an example which should make things much clearer.

## Behind the Curtain

There's a very straightforward type definition for [`domready`](https://github.com/ded/domready) in the Typings Registry.  The code that makes up the definition is as simple as:

```ts
declare function domready(callback: () => any) : void;

export = domready;
```

Couldn't be simpler.  To install that definition it's a case of `typings install domready` which will create a `typings/main/definitions/domready/domready.d.ts` file in your repo:

```ts
// Compiled using typings@0.6.5
// Source: https://raw.githubusercontent.com/unional/typed-domready/881449d638c89897b1e70172ab5413b8886b4ef9/main.d.ts
declare module 'domready/main' {
function domready(callback: () => any) : void;

export = domready;
}
declare module 'domready' {
import main = require('domready/main');
export = main;
}
```

If you look closely at the code above, you'll see the original type definition has been imported and "wrapped" as a global external module called `'domready'` by Typings.

How did this come about?  Well, this was the installation experience:

```sh
PS > typings install domready
? Found domready typings for NPM. Continue? Yes
Installing domready@~1.0.8 (NPM)...

domready
└── (No dependencies)
```

Typings looked up domready in the Typings Registry at this location: https://github.com/typings/registry/blob/master/npm/domready.json.  That file contained this data:

```json
{
  "versions": {
    "1.0.8": "github:unional/typed-domready#881449d638c89897b1e70172ab5413b8886b4ef9"
  }
}
```

Plainly `github:unional/typed-domready#881449d638c89897b1e70172ab5413b8886b4ef9` points back to `https://github.com/unional/typed-domready/tree/881449d638c89897b1e70172ab5413b8886b4ef9` which is the location of the actual type definition.

And here's something you should notice; https://github.com/unional/typed-domready contains a key file: `typings.json`:

```json
{
  "name": "domready",
  "main": "main.d.ts",
  "dependencies": {
  }
}
```

i.e. Each entry in the Typings Registry declares its own **versioned** dependencies.

So this is the difference between DefinitelyTyped and the Typings registry: DT for the most part makes use of reference statements (eg `/// <reference path="../../typings/jquery/jquery.d.ts" />`) to declare dependencies based on the assumption that everything is globally declared from the get go and lives in a single repo (DT).

With Typings the dependencies are entirely isolated as Typings are **not** global until Typings installs them and makes them global.  And the user of Typings decides on the form those global definitions take.
