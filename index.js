"use strict";

function union(dst, src) {
	if (typeof dst !== 'object')
		throw TypeError('destination isn`t object');
	if (typeof src !== 'object')
		throw TypeError('source isn`t object');
	for (var id in src) {
		var s = src[id], d = dst[id],
		    s_is_obj = typeof s === 'object' && s !== null,
		    d_is_obj = typeof d === 'object' && d !== null;
		if (s_is_obj === d_is_obj)
			if (d_is_obj)
				union(dst[id], s);
			else
				dst[id] = s;
		else
			if (d_is_obj) // object <= some
				d['.'] = s;
			else // some <= object
				if (id in dst)
					union(dst[id] = { '.':d }, s);
				else
					dst[id] = s;
	}
	return dst;
}

/* ----------------------------------------------------------------------------------------------------------------------- */
function Executor() {
	this.routes = {};
}

Executor.prototype = {
	exec: function (name, args, done) {
		var path = name.split(/\s+/);
		function d(e,c,as) {
			if (typeof e === 'string')
				return done({ status: !c || c[0]==='W' ? 'warning' : 'error', code: c || 'WARN', message: e, args: as||[] });
			done(e instanceof Error ? { status: 'error', code: e.code || 'ERR', message: e.message, args: [ ] } : (e || { status: 'ok' }));
		}
		function nocmd() {
			return d('unknown command $1', 'ENOCMD', [ name ]);
		}
		function _(i, o) {
			var sub_name = path[i];
			if (!sub_name)
				return nocmd();
			var sub = o[sub_name];
			if (!sub)
				return nocmd();
			switch (typeof sub) {
			case 'function':
				return sub(args, d);
			case 'string':
				return d('$1: $2', 'ENOTIMPL', [ name, sub ]);
			}
			_(i+1, sub);
		}
		_(0, this.routes);
		return this;
	},

	install: function (new_routes) {
		union(this.routes, new_routes);
		return this;
	},

	batch: function (cmds, done) {
		if (typeof cmds === 'string') {
			cmds = Array.prototype.slice.apply(arguments);
			done = typeof cmds[cmds.length-1] === 'function' ? cmds.splice(cmds.length-1, 1)[0] : undefined;
		}

		var self = this,
		    rets = [],
		    common_args = {};

		function join(self, obj) {
			for (var nm in obj)
				self[nm] = obj[nm];
			return self;
		}

		function sub_exec(i) {
			if (i >= cmds.length)
				return done ? done.apply(self, rets) : 0;

			var cmd = cmds[i];

			if (typeof cmd === 'object') {
				join(common_args, cmd);
				return sub_exec(i+1);
			}

			var args = join({}, common_args);

			if (typeof cmds[i+1] === 'object')
				join(args, cmds[++i]);

			self.exec(cmd, args, function (ret) {
				if (!done && self.echo)
					self.echo(cmd, args, ret);
				rets.push(ret);
				sub_exec(i+1);
			});
		}

		sub_exec(0);
		return this;
	}
};

module.exports = Executor;
Executor.union = union;
