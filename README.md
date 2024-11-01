[![Gitter][gitter-image]][gitter-url]
[![NPM version][npm-image]][npm-url]
[![Build status][travis-image]][travis-url]
[![Test coverage][coveralls-image]][coveralls-url]
[![Dependency Status][david-image]][david-url]
[![License][license-image]][license-url]
[![Downloads][downloads-image]][downloads-url]

# nano-ci-router

Command interface router module.

## API

```js
var CiRouter = require('nano-ci-router');

var ci = new CiRouter();

ci.install({
	'get': {
		'version': function (args, done) {
			done('5.0');
		},
		'file': function (args, done) {
			fs.readFile(Path.join(STORAGE, args.path), 'utf8', function (err, text) {
				done(err || text);
			});
		}
	}
});

ci.exec('get version', function (v) {
	console.log(v);
});

ci.batch([ 'get version', 'get file', { path: 'README.md' } ], function (ver, text) {
	console.log(ver); // will print 5.0
	console.log(text); // will print README.md file content
});
```

[bithound-image]: https://www.bithound.io/github/Holixus/nano-ci-router/badges/score.svg
[bithound-url]: https://www.bithound.io/github/Holixus/nano-ci-router

[gitter-image]: https://badges.gitter.im/Holixus/nano-ci-router.svg
[gitter-url]: https://gitter.im/Holixus/nano-ci-router

[npm-image]: https://badge.fury.io/js/nano-ci-router.svg
[npm-url]: https://badge.fury.io/js/nano-ci-router

[github-tag]: http://img.shields.io/github/tag/Holixus/nano-ci-router.svg
[github-url]: https://github.com/Holixus/nano-ci-router/tags

[travis-image]: https://travis-ci.org/Holixus/nano-ci-router.svg?branch=master
[travis-url]: https://travis-ci.org/Holixus/nano-ci-router

[coveralls-image]: https://coveralls.io/repos/github/Holixus/nano-ci-router/badge.svg?branch=master
[coveralls-url]: https://coveralls.io/github/Holixus/nano-ci-router?branch=master

[david-image]: https://david-dm.org/Holixus/nano-ci-router.svg
[david-url]: https://david-dm.org/Holixus/nano-ci-router

[license-image]: https://img.shields.io/badge/license-MIT-blue.svg
[license-url]: LICENSE

[downloads-image]: http://img.shields.io/npm/dt/nano-ci-router.svg
[downloads-url]: https://npmjs.org/package/nano-ci-router
