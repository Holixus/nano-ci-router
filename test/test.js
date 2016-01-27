var CiRouter = require('../index.js');

var css = require('../index.js'),
    assert = require('core-assert'),
    json = require('nano-json'),
    timer = require('nano-timer');

function uni_test(fn, sradix, dradix, args, ret) {
	test(fn.name+'('+json.js2str(args, sradix)+') -> '+json.js2str(ret, dradix)+'', function (done) {
		assert.deepStrictEqual(args instanceof Array ? fn.apply(null, args) : fn.call(null, args), ret);
		done();
	});
}

function massive(name, fn, pairs, sradix, dradix) {
	suite(name, function () {
		for (var i = 0, n = pairs.length; i < n; i += 2)
			uni_test(fn, sradix, dradix, pairs[i], pairs[i+1]);
	});
}


suite('union', function () {

	var union = CiRouter.union;

	massive('objects', union, [
		[ {}, {} ], {},
		[ {}, { a:1 } ], { a: 1 },
		[ {}, { a: { b:1 } } ], { a: { b:1 } },
		[ { a: {} }, { b: {} } ], { a: {}, b: {} },
		[ { a: { a: 1 } }, { a: { b: 2 } } ], { a: { a:1, b: 2 } },
		[ { a: { a: 1 } }, { a: 2 } ], { a: { a:1, '.': 2 } },
		[ { a: 1 }, { a: { b: 2 } } ], { a: { '.':1, b: 2 } }
	], 10, 10);

	test('non-objects', function (done) {
		try {
			union(5,5);
			done(Error('error wasn`t thrown'));
		} catch (e) {
			done();
		}
	});

	test('non-objects', function (done) {
		try {
			union({},5);
			done(Error('error wasn`t thrown'));
		} catch (e) {
			done();
		}
	});
});

suite('ci-router.batch', function () {

	test('two commands array', function (done) {
		var ci = new CiRouter();

		ci.install({
			'a': function (args, d) { return d({ o: 'a' }); },
			'b': function (args, d) { return d({ o: 'b' }); }
		});

		ci.batch([ 'a', 'b' ], function (a, b) {
			assert.strictEqual(a.o, 'a');
			assert.strictEqual(b.o, 'b');
			done();
		});
	});

	test('two commands array width args', function (done) {
		var ci = new CiRouter(),
		    a1 = { a:1 },
		    a2 = { b:2 };

		ci.install({
			'a': function (args, d) {
				assert.deepStrictEqual(args, a1);
				return d({ o: 'a' });
			},
			'b': function (args, d) {
				assert.deepStrictEqual(args, a2);
				return d({ o: 'b' });
			}
		});

		ci.batch([ 'a', a1, 'b', a2 ], function (a, b) {
			assert.strictEqual(a.o, 'a');
			assert.strictEqual(b.o, 'b');
			done();
		});
	});

	test('two commands array width common arg', function (done) {
		var ci = new CiRouter(),
		    a1 = { a:1 },
		    a2 = { b:2 };

		ci.install({
			'a': function (args, d) {
				assert.deepStrictEqual(args, a1);
				return d({ o: 'a' });
			},
			'b': function (args, d) {
				assert.deepStrictEqual(args, a1);
				return d({ o: 'b' });
			}
		});

		ci.batch([ a1, 'a', 'b' ], function (a, b) {
			assert.strictEqual(a.o, 'a');
			assert.strictEqual(b.o, 'b');
			done();
		});
	});

	test('two commands array width common arg mixing', function (done) {
		var ci = new CiRouter(),
		    ac = { c:1 },
		    a1 = { a:1 }, ac1 = { c:1, a:1 },
		    a2 = { b:2 }, ac2 = { c:1, b:2 };

		ci.install({
			'a': function (args, d) {
				assert.deepStrictEqual(args, ac1);
				return d({ o: 'a' });
			},
			'b': function (args, d) {
				assert.deepStrictEqual(args, ac2);
				return d({ o: 'b' });
			}
		});

		ci.batch([ ac, 'a', a1, 'b', a2 ], function (a, b) {
			assert.strictEqual(a.o, 'a');
			assert.strictEqual(b.o, 'b');
			done();
		});
	});

	test('two commands', function (done) {
		var ci = new CiRouter();

		ci.install({
			'a': function (args, d) { return d({ o: 'a' }); },
			'b': function (args, d) { return d({ o: 'b' }); }
		});

		ci.batch('a', 'b', function (a, b) {
			assert.strictEqual(a.o, 'a');
			assert.strictEqual(b.o, 'b');
			done();
		});
	});

	test('two commands echo', function (done) {
		var ci = new CiRouter();

		ci.install({
			'a': function (args, d) { return d({ o: 'a' }); },
			'b': function (args, d) { return d({ o: 'b' }); }
		});

		var cmds = '';

		ci.echo = function (cmd, args, ret) {
			switch (cmd) {
			case 'a':
				assert.deepStrictEqual(ret, { o: 'a' });
				break;
			case 'b':
				assert.deepStrictEqual(ret, { o: 'b' });
				break;
			}
			cmds += cmd;
			if (cmds === 'ab')
				done();
			//if (ret)
				//console.log('> %s', cmd, args, '>', ret);
		};

		ci.batch('a', 'b');
	});

	test('commands results', function (done) {
		var ci = new CiRouter();

		ci.install({
			'a': function (args, d) { return d({ o: 'a' }); },
			'b': function (args, d) { return d('error $1', 'ESOME', [ 1 ]); },
			'c': function (args, d) { return d('warning $1', 'WSOME', [ 2 ]); },
			'd': function (args, d) { return d('just warning', 'WSOME'); },
			'e': function (args, d) { return d('only warning'); },
			'f': function (args, d) { return d(Error('oh')); },
			'g': function (args, d) { return d(); }
		});

		ci.batch('a', 'b', 'c', 'd', 'e', 'f', 'g', function (a, b, c, d, e, f, g) {
			assert.deepStrictEqual(a, { o: 'a' });
			assert.deepStrictEqual(b, { status: 'error', code: 'ESOME', message: 'error $1', args: [ 1 ] });
			assert.deepStrictEqual(c, { status: 'warning', code: 'WSOME', message: 'warning $1', args: [ 2 ] });
			assert.deepStrictEqual(d, { status: 'warning', code: 'WSOME', message: 'just warning', args: [] });
			assert.deepStrictEqual(e, { status: 'warning', code: 'WARN', message: 'only warning', args: [] });
			assert.deepStrictEqual(f, { status: 'error', code: 'ERR', message: 'oh', args: [] });
			assert.deepStrictEqual(g, { status: 'ok' });
			done();
		});
	});

	test('unknown command', function (done) {
		var ci = new CiRouter();

		ci.install({
			'group': {
				'c': function (args, d) { return d({ o: 'c' }); },
			},
			'a': function (args, d) { return d({ o: 'a' }); },
			'b': function (args, d) { return d({ o: 'b' }); }
		});

		ci.batch([ 'c', 'd', 'group', 'group d', 'group r t', 'blah blah blah' ], function (a, b, c, d, e, f) {
			assert.deepStrictEqual(a, { status: 'error', code: 'ENOCMD', message: 'unknown command $1', args: ['c'] });
			assert.deepStrictEqual(b, { status: 'error', code: 'ENOCMD', message: 'unknown command $1', args: ['d'] });
			assert.deepStrictEqual(c, { status: 'error', code: 'ENOCMD', message: 'unknown command $1', args: ['group'] });
			assert.deepStrictEqual(d, { status: 'error', code: 'ENOCMD', message: 'unknown command $1', args: ['group d'] });
			assert.deepStrictEqual(e, { status: 'error', code: 'ENOCMD', message: 'unknown command $1', args: ['group r t'] });
			assert.deepStrictEqual(f, { status: 'error', code: 'ENOCMD', message: 'unknown command $1', args: ['blah blah blah'] });
			done();
		});
	});

	test('not implemented command', function (done) {
		var ci = new CiRouter();

		ci.install({
			'a': function (args, d) { return d({ o: 'a' }); },
			'b': function (args, d) { return d({ o: 'b' }); },
			'c': 'not implemented',
			'd': '-not implemented-'
		});

		ci.batch([ 'c', 'd' ], function (a, b) {
			assert.deepStrictEqual(a, { status: 'error', code: 'ENOTIMPL', message: '$1: $2', args: ['c', 'not implemented'] });
			assert.deepStrictEqual(b, { status: 'error', code: 'ENOTIMPL', message: '$1: $2', args: ['d', '-not implemented-'] });
			done();
		});
	});

});
