/**
 * node-gitrepo
 * node.js module for controlling git repositories
 * --
 * @author Jan Kuča <jan@jankuca.com>
 */

var spawn = require('child_process').spawn,
	Path = require('path'),
	FileSystem = require('fs');


var Repository = function (path, bare) {
	path = Path.normalize(path);
	if (!bare) {
		this.tree_dir = path;
		this.git_dir = Path.join(path, '.git');
	} else {
		this.tree_dir = null;
		this.git_dir = path;
	}
	this.bare = bare;
};

Repository.prototype.init = function (callback) {
	var args = [];
	args.push('init');
	if (this.bare) {
		args.push('--bare');
	}
	args.push(this.tree_dir);

	this._exec(args, callback);
};

Repository.prototype.cloneFrom = function (url, branch, callback) {	
	if (arguments.length === 2) {
		callback = arguments[1];
		branch = 'master';
	}

	var args = [];
	args.push('clone', url);
	args.push(this.tree_dir);
	args.push('-b', branch);

	this._exec(args, callback);
};

Repository.prototype.addRemote = function (name, url, branch, callback) {
	if (arguments.length === 3) {
		callback = arguments[2];
		branch = 'master';
	}

	var args = this._getCommonArgs();
	args.push('remote', 'add', name);
	args.push(url);
	args.push('-b', branch);

	this._exec(args, callback);
};

Repository.prototype.add = function (target, callback) {
	var args = this._getCommonArgs();
	args.push('add', target);

	this._exec(args, callback);
};

Repository.prototype.addFrom = function (source, target, callback) {
	FileSystem.rename(source, Path.join(this.tree_dir, target), function (err) {
		if (err) {
			callback(err);
		} else {
			var args = this._getCommonArgs();
			args.push('add', target);

			this._exec(args, callback);
		}
	}.bind(this));
};

Repository.prototype.commit = function (message, callback) {
	var args = this._getCommonArgs();
	args.push('commit');
	args.push('-m', message);

	this._exec(args, callback);
};

Repository.prototype.pull = function (remote, branches, callback) {
	var args = this._getCommonArgs();
	args.push('pull', remote, branches);

	this._exec(args, callback);
};

Repository.prototype.push = function (remote, branches, callback) {
	var args = this._getCommonArgs();
	args.push('push', remote, branches);

	this._exec(args, callback);
};


Repository.prototype._getCommonArgs = function () {
	var args = [];
	args.push('--git-dir=' + this.git_dir);
	if (!this.bare) {
		args.push('--work-tree=' + this.tree_dir);
	}

	return args;
};

Repository.prototype._exec = function (args, callback) {
	var op = spawn('git', args);
	if (typeof callback === 'function') {
		var log = [];
		op.on('exit', function (code) {
			var err = (parseInt(code, 10) === 0) ? null : new Error(log[0]);
			callback(err, log);
		});
		op.stdout.on('data', function (buffer) {
			log.push(buffer.toString());
		});
		op.stderr.on('data', function (buffer) {
			log.push(buffer.toString());
		});
	}
};


exports.Repository = Repository;