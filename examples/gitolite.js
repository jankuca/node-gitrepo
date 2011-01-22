var Path = require('path');
require.paths.unshift(Path.join(__dirname, '../src/'));

var git = require('node-gitrepo');

var repo = new git.Repository('/tmp/gitolite-admin');
repo.cloneFrom('gitrepos:gitolite-admin', function (err) {
	var makeChanges = function (err) {
		repo.addFrom('/tmp/whatever', 'keydir/somethingelse.pub', function (err) {
			repo.commit('add public key for somethingelse', function (err) {
				repo.push('origin', 'master', function (err) {
					console.log('alright!');
				});
			});
		})
	};

	if (err) {
		repo.pull('origin', 'master', makeChanges);
	} else {
		makeChanges();
	}
});