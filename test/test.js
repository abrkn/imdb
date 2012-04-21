var testCase = require('nodeunit').testCase;
var imdb = require('../imdb');
var _ = require('underscore');

module.exports = testCase({
	'title': testCase({
		'not found': function(test) {
			imdb.title('tt94332211', function(err, title) {
				test.ok(err);
				test.ok(/not found/i.test(err.message));
				test.ok(!title);
				test.done();
			});
		},

		'daily show': function(test) {
			imdb.title('tt0115147', function(err, title) {
				test.ok(!err);

				// Unable to use deep equal due to changing ratings, etc.
				test.equal(title.name, "The Daily Show");
				test.ok(title.seasons >= 17);
				test.ok(title.rating > 5 && title.rating < 10);
				test.ok(title.votes >= 3000);
				test.ok(/https?:\/{2}.+\.(jpg|png)/i.test(title.cover));

				test.done();
			});
		},

		'walrus (2011)': function(test) {
			imdb.title('tt2069977', function(err, title) {
				test.ok(!err);

				test.equal(title.name, "Walrus");
				test.ok(typeof title.seasons, 'undefined');
				test.equal(typeof title.rating, 'undefined');
				test.equal(typeof title.votes, 'undefined');
				test.equal(typeof title.cover, 'undefined');

				test.done();
			});
		},
	}),

	'episodes': testCase({
		'wharehouse 13 s1': function(test) {
			imdb.episodes('tt1132290', 1, function(err, episodes) {
				test.ok(!err, err ? err.message : null);
				console.log(err);
				test.ok(_.isArray(episodes));
				test.equal(episodes.length, 12);

				test.deepEqual(episodes[0], 
					{
						number: 1,
						name: "Pilot",
						airdate: "2009-07-07",
						id: "tt1417762"
					}
				);

				test.deepEqual(episodes[3], {
						number: 4,
						name: "Claudia",
						airdate: "2009-07-28",
						id: "tt1431669"
					}
				);

				test.done();
			});
		},

		'daily show s8': function(test) {
			imdb.episodes('tt0115147', 8, function(err, episodes) {
				test.ok(_.isNull(err));
				test.ok(_.isArray(episodes));
				test.equal(episodes.length, 161);

				// This is a good episode to test because of escapable characters in the name.
				test.equal(episodes[41].number, 42);
				test.equal(episodes[41].name, "Re-Decision 2003: The California Recall");
				test.equal(episodes[41].airdate, "2003-10-07");
				test.equal(episodes[41].id, "tt1619334");

				test.done();
			});
		}
	})
});