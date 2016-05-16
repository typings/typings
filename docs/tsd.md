# From TSD to Typings

You're possibly wondering what it's like going from using TSD to Typings. Using Typings is very similar to using TSD. Where you previously would have:

```
tsd install react --save
```

You would now:

```
typings install dt~react --global --save
```

Likewise, this:

```
tsd query react
```

becomes:

```
typings search react
```

The `--global` flag tells Typings to accept type definitions that are "global" in nature. Currently, DefinitelyTyped typings are all "global".

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
    "typings/index.d.ts",
    "src/main.ts"
  ]
}
 ```
