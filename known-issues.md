# Known Issues

## Augmentation limitation

While you can augment existing modules by adding new types (interface, class, etc),
you cannot merge types (for example, adding property to interface).

This is due to design limitation in TypeScript that augmentation does not work with `export *` syntax:
<https://github.com/Microsoft/TypeScript/issues/9532>

Workaround: TBD
