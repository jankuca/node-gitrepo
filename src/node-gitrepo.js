/**
 * node-gitrepo
 * node.js module for controlling git repositories
 * --
 * @author Jan Kuča <jan@jankuca.com>
 */

var child_process = require('child_process'),
	spawn = child_process.spawn,
	exec = child_process.exec,
	Path = require('path'),
	FileSystem = require('fs');


var Repository = function (path, bare) {
	path = Path.normalize(path);
	if (!bare) {
		this.tree_dir = Path.normalize(path + '/');
		this.git_dir = Path.join(path, '.git');
	} else {
		this.tree_dir = null;
		this.git_dir = path;
	}
	this.bare = !!bare;
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

Repository.prototype.addRemote = function (name, url, callback) {
	var args = [];
	args.push('remote', 'add', name);
	args.push(url);

	this._exec(args, callback);
};

Repository.prototype.add = function (target, callback) {
	var args = [];
	args.push('add', target);

	this._exec(args, callback);
};

Repository.prototype.addFrom = function (source, target, callback) {
	FileSystem.rename(source, Path.join(this.tree_dir, target), function (err) {
		if (err) {
			callback(err);
		} else {
			var args = [];
			args.push('add', target);

			this._exec(args, callback);
		}
	}.bind(this));
};

Repository.prototype.commit = function (message, callback) {
	var args = [];
	args.push('commit');
	args.push('-m', message);

	this._exec(args, callback);
};

Repository.prototype.pull = function (remote, branches, callback) {
	var args = [];
	args.push('pull', remote, branches);

	this._exec(args, callback);
};

Repository.prototype.push = function (remote, branches, callback) {
	var args = [];
	args.push('push', remote, branches);

	this._exec(args, callback);
};

Repository.prototype.updateSubmodules = function (callback) {
	var args = [];
	args.push('submodule', 'update');
	args.push('--init');
	args.push('--recursive');

	this._exec(args, callback);
};

Repository.prototype.listBranches = function (callback) {
	var args = [];
	args.push('branch');

	this._exec(args, function (err, log) {
		if (err) {
			callback(err, null);
		} else {
			var branches = [];

			log = log.join("\n").split("\n");
			log.forEach(function (line) {
				line = line.substr(2);
				if (line) {
					line = line.split(' ');
					branches.push(line[0]);
				}
			});

			callback(null, branches);
		}
	});
};

Repository.prototype.listBranchesAndTipCommits = function (callback) {
	var args = [];
	args.push('branch');
	args.push('-v');

	this._exec(args, function (err, log) {
		if (err) {
			callback(err, null);
		} else {
			var map = {};

			log = log.join("\n").split("\n");
			log.forEach(function (line) {
				line = line.substr(2);
				if (line) {
					line = line.split(' ');
					map[line[0]] = line[1];
				}
			});

			callback(null, map);
		}
	});
};

Repository.prototype._exec = function (args, callback) {
	var op = spawn('git', args, {
		'cwd': this.tree_dir || this.git_dir
	});
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


module.exports = Repository;
