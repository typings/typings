# External Module Format
Typings are written in non-ambient external module format. Most of the time we refer it simply as external module format.

This is the same format you will get if you run `tsc -d` without bundling the file (i.e., not using the `outFile` parameter).

This document will gives you an overview of what is external module format and why the typings need to be written in this format.

## What is ambient?
Ambient is the term refers to somethings that is aware of or relate to its immediate surrounding. An ambient module is a module that awares how it fits in its surrounding.

In programming terms, ambient module defines its external identifier(s). i.e. it defines how should other code access it.

For example, `jQuery` has two external identifiers: the global identifier `$` and the module name `'jquery'`.

Any code that uses `jQuery` will access it through either the global identifier `$` or `var $ = require('jquery');`.

## Why non-ambient?
Typings are written in non-ambient format because **at the time of definition, you, the typed definition writer, will not know how it will be accessed in the user environment**.  It allows user to customize the module's name.

For example, I want to use two versions of `jQuery` because I need some features from the latest and greatest `jQuery` while my project was already using an older version. To avoid conflict, I want to include the latest `jQuery` as `jquery-latest` and use it through `import $$ = require('jquery-latest')`.

If the `jQuery` typings is ambient, then the two versions of `jQuery` will conflict each other and fight for the global variable `$` and the module name `'jquery'`.

Keeping typings non-ambient avoids this conflict. I can define the latest `jQuery`'s module name as `'jquery-latest'` through the command `typings install jquery --name jquery-latest`.
