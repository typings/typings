# Known Issues

## Augmentation limitation

While you can augment existing modules by adding new types (interface, class, etc),
you cannot merge types (for example, adding property to interface).

This is due to design limitation in TypeScript that augmentation does not work with `export *` syntax:
<https://github.com/Microsoft/TypeScript/issues/9532>

Workaround: TBD

## Global Dependencies

If the typings have global dependencies listed, they will not be installed with the typings automatically.
The consumer will see a `INFO` message like `"\<typings x\>" lists global dependencies on "\<typings y\>" and should be installed`.
The consumer will need to install them manually.

This is a limitation because global dependencies, by definition, are global. They declare themselves in the [global environment](http://www.ecma-international.org/ecma-262/7.0/index.html#sec-lexical-environments).

Because of this, if there are two modules depends on the same global dependency, that dependency would be installed twice causing "Duplicate Identifier" errors.

Workaround:
- Create typings in external module format, or
- Consumer needs to install them manually
