require('mocha');
var imdb = require('../lib/imdb.js');
var _ = require('underscore');
var should = require('should');

describe("title", function() {
	it('not found', function(done) {
		imdb.title('tt94332211', function(err, title) {
			should.exist(err);
			err.message.should.match(/not found/i);
			should.not.exist(title);

			done();
		});
	});

	it('daily show', function(done) {
		imdb.title('tt0115147', function(err, title) {
			should.not.exist(err);

			// Unable to use deep equal due to changing ratings, etc.
			title.should.have.property('name');
			title.name.should.equal("The Daily Show with Jon Stewart");
			title.seasons.should.be.above(16);
			title.rating.should.be.above(5).and.below(10);
			title.votes.should.be.above(3000);
			title.cover.should.match(/https?:\/{2}.+\.(jpg|png)/i);

			done();
		});
	});

	it('reads synopsis', function(done) {
		// Heroes (series)
		imdb.title('tt0813715', function(err, title) {
			should.not.exist(err);

			title.should.have.property('synopsis');
			title.synopsis.should.eql("They thought they were like everyone else... until they woke with incredible abilities.");

			done();
		});
	});

	it('reads synopsis (episode)', function(done) {
		// Heroes (series)
		imdb.title('tt1054841', function(err, title) {
			should.not.exist(err);

			title.should.have.property('synopsis');
			title.synopsis.should.eql("At the behest of his new employers, Dr. Suresh travels to Haiti to treat a potential virus victim. The patient turns out to be a familiar face...");

			done();
		});
	});

	it('reads genres (episode)', function(done) {
		// Heroes (series)
		imdb.title('tt1054841', function(err, title) {
			should.not.exist(err);

			title.should.have.property('genres');
			title.genres.should.eql([ "Drama", "Sci-Fi", "Thriller"]);

			done();
		});
	});

	it('walrus (2011)', function(done) {
		imdb.title('tt2069977', function(err, title) {
			should.not.exist(err);

			title.name.should.equal("Walrus");
			should.not.exist(title.seasons);
			should.not.exist(title.rating);
			should.not.exist(title.rating);
			should.not.exist(title.votes);
			should.not.exist(title.cover);

			done();
		});
	});
});

describe('episodes', function() {
	it('wharehouse 13 s1', function(done) {
		imdb.episodes('tt1132290', 1, function(err, episodes) {
			should.not.exist(err);
			should.exist(episodes);
			episodes.should.have.property("length");
			episodes.length.should.equal(12);

			episodes[0].should.eql({
				number: 1,
				name: "Pilot",
				airdate: "2009-07-07",
				id: "tt1417762"
			});

			episodes[3].should.eql({
				number: 4,
				name: "Claudia",
				airdate: "2009-07-28",
				id: "tt1431669"
			});

			done();
		});
	});

	it('daily show s8', function(done) {
		imdb.episodes('tt0115147', 8, function(err, episodes) {
			should.not.exist(err);
			should.exist(episodes);
			episodes.should.have.property("length");
			episodes.length.should.equal(161);

			// This is a good episode to test because of escapable characters in the name.
			episodes[41].number.should.equal(42);
			episodes[41].name.should.equal("Re-Decision 2003: The California Recall");
			episodes[41].airdate.should.equal("2003-10-07");
			episodes[41].id.should.equal("tt1619334");

			done();
		});
	});
});