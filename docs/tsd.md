# From TSD to Typings

**Important: For existing TSD users, Typings will install from DefinitelyTyped using the `--ambient` flag. Other dependencies are maintained in the [registry](https://github.com/typings/registry).**

You're possibly wondering what it's like going from using TSD to Typings. Using Typings is very similar to using TSD. Where you previously would have:

```
tsd install react --save
```

You would now:

```
typings install react --ambient --save
```

Likewise, this:

```
tsd query react
```

becomes:

```
typings search react --ambient
```

In both cases the `--ambient` flag is required; it includes DefinitelyTyped in the lookup. DT can generally be viewed as a source of ambient definitions (both internal and external). For clarity about what ambient definitions are, it's worth taking a look at the [TypeScript Handbook (Ambient Modules)](http://www.typescriptlang.org/docs/handbook/modules.html).

# Upgrade

Delete the old `typings` directory: 

```
rm -rf typings
```

Use the old `tsd.json` to load the config for `typings` and then delete that as well: 

```
$ typings init --upgrade
$ rm tsd.json
$ typings install
```

Add the new `main.d.ts` to your your `tsconfig.json`:

```json
 {
  "filesGlob": [
    "src/**/*.ts",
    "typings/main.d.ts"
  ]
}
 ```

Finally, based on if you are working primarily on the browser or Node.js, specify an `"exclude"` in your `tsconfig.json`; e.g.: 

```json
 {
  "exclude": [
    "typings/browser.d.ts",
    "typings/browser",
    "node_modules"
  ]
}
 ```
