# From TSD to Typings

**Important: For existing TSD users, Typings installs from DefinitelyTyped when using the `--ambient` flag (by default, this can be configured from `.typingsrc`). Other dependencies are maintained in the [registry](https://github.com/typings/registry).**

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
typings search react
```

The `--ambient` flag tells Typings to accept type definitions that are "global" in nature. Currently, DefinitelyTyped typings are all "global" (known as "ambient", in Typings).

# Upgrade

Delete the old `typings` directory:

```sh
rm -rf typings
```

Use the old `tsd.json` to load the config for `typings` and then delete that as well:

```sh
typings init --upgrade
rm tsd.json
typings install
```

Finally, update your `tsconfig.json` according to the Typings resolution [you wish to include](https://github.com/typings/typings/blob/master/docs/faq.md#module-resolutions). For example:

```json
 {
  "files": [
    "typings/browser.d.ts",
    "src/main.ts"
  ]
}
 ```
