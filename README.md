# MdQuery

[![npm package][npm-img]][npm-url]
[![dependency status][libraries-img]][libraries-url]
[![build status][travis-img]][travis-url]

> creating tables from hierarchic structured data in Markdown documents

## Application

_MdQuery_ allows to generate automatic [tables][mdtables] and lists in a [Markdown] document.

_MdQuery_ extracts a hierarchic datastructure from a [Markdown] document (with [_MdData_][mddata]) and replaces data queries in HTML comments by a table or
a list, containing the result of the query.

Take a look at the [test case for tables](test/data/data-table-complex.md) and
the [test case for lists](test/data/data-list-complex.md) to get an impression, how it works.

_MdQuery_ can be used as a function or as a [Gulp] transformation.

## Interface

_MdQuery_ makes use of [GulpText _simple_][gulp-text-simple] v0.3 to provide the API.
Therefore, it currently supports three ways of usage.

1. Use the `readFileSync(path)` function, to get the processed
   content of a Markdown file.
2. Specify a Markdown string, to get the processed string.
3. Give no arguments, to get a gulp transformation.

**Hint:** Please note, the main entry in the API of _MdQuery_ is the `transform` attribute of the module.

### Transform a file directly

Use the function `readFileSync(path)` and specify a path to the Markdown file.

``` js
var mdquery = require('mdquery').transform;
var result = mdquery.readFileSync('project_a/docs/index.md');
```

### Transform a string

Give a string to process as [Markdown] text.

``` js
var mdquery = require('mdquery').transform;
var result = mdquery('# Intoduction ...');
```

### Create a Gulp transformation

Call without arguments to create a [Gulp] transformation.

``` js
var mdquery = require('mdquery').transform;
var gulp = require('gulp');

gulp.task('preprocess-markdown', function() {
    return gulp.src('docs/*.md')
        .pipe(mdquery())
        .pipe(gulp.dest('out'));
});
```

## License

_MdQuery_ is published under the MIT license.

[npm-url]: https://www.npmjs.com/package/mdquery
[npm-img]: https://img.shields.io/npm/v/mdquery.svg
[libraries-url]: https://libraries.io/npm/mdquery
[libraries-img]: https://img.shields.io/librariesio/github/mastersign/mdquery.svg
[travis-img]: https://img.shields.io/travis/mastersign/mdquery/master.svg
[travis-url]: https://travis-ci.org/mastersign/mdquery
[Gulp]: http://gulpjs.com
[Markdown]: https://daringfireball.net/projects/markdown/
[mdtables]: https://michelf.ca/projects/php-markdown/extra/#table
