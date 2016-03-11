# From TSD to Typings

**Important: For existing TSD users, Typings will install from DefinitelyTyped using the `--ambient` flag. Other dependencies are maintained in the [registry](https://github.com/typings/registry).**

You're possibly wondering what it's like going from using TSD to Typings. To use Typings as you used TSD the migration is not extreme. Where you previously would have:

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

In both cases the `--ambient` flag is required in order that DefinitelyTyped is included in the lookup. DT can generally be viewed as a source of ambient definitions; both internal and external. For clarity about what ambient definitions are it's worth taking a look at the [TypeScript Handbook](http://www.typescriptlang.org/Handbook#modules-working-with-other-javascript-libraries).

# Upgrade

Simple: 

```
$ typings init --upgrade
$ rm tsd.json
$ typings install
```
