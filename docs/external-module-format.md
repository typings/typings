# External Module Format
Typings are written in non-ambient external module format. Most of the time we refer it simply as external module format.

This is the same format you will get if you run `tsc -d` without bundling the file (i.e., not using the `outFile` parameter).

This document will gives you an in-depth view of what is external module format and why the typings need to be written in this format.

## What does it mean by non-ambient?
Ambient is the term refers to somethings that is aware or relate to its immediate surrounding. An ambient module is a module that awares how it fits in its surrounding.

In programming terms, ambient module awares of its external reference point. i.e. it knows (and thus defines) how other code access it.

For example, `jQuery` has two external reference points: `window.$` and `'jquery'`. It knows (because it defines) everyone is using it through the `$` reference or `var $ = require('jquery');`.

## Why non-ambient?
Typings are written in non-ambient form because **at the time of definition, you, the typed definition writer, will not know how it will be accessed in the user environment**.  This is drastically different compare to the old days when everything is accessed through the global namespace.

For example, I may use two versions of `jQuery` because I need some feature from the latest and greatest `jQuery` while my project use a legacy version.  So I call the latest `jQuery` as `jQuery-latest` and use it through `import $$ = require('jQuery-latest')`.

If the `jQuery` typings is ambient, than the two versions of `jQuery` will conflict each other and fight for the `$` and `'jquery'`.

The solution to this is to keep the typings non-ambient and when the user want to use it, the user defines how he/she wants to access it.
