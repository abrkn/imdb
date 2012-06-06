var request = require('request');
var _ = require('underscore');
var htmlparser = require('htmlparser');
var select = require('soupselect').select;
var debug = require('debug')('imdb');
var validator = require('validator');

var util = {
	titleUrl: function(id) { 
		return 'http://www.imdb.com/title/' + id + '/';
	}
};

function htmlDecode (s) {
	return validator.sanitize(s).entityDecode();
}

String.prototype.trim = function() { return this.replace(/^\s+|\s+$/g, ''); };

exports.timeout = 10 * 1000;

module.exports = {
	language: "en-US",

	title: function(id, callback) {
		if (_.isNull(callback)) {
			throw new Error('callback not specified');
		}

		if (!id || !/tt\d+/.test(id)) {
			return callback(new Error('invalid imdb id format'));
		}

		var url = util.titleUrl(id);

		request({ url: url, timeout: exports.timeout, headers: { "Accept-Language": module.exports.language } }, function(err, res, body) {
			if (err) {
				return callback(err);
			}

			if (res.statusCode == 404) {
				return callback(new Error('title not found (404)'));
			}

			if (res.statusCode != 200) {
				return callback(new Error('status code ' + res.statusCode + ' from imdb'));
			}

			var title = {
				id: id,
				name: /itemprop=.name.>\s*([^<]+)/.exec(htmlDecode(body))[1].trim()
			};

			var m;

			// Year
			if (m = /span[^>]+>\(<a\s*href=.\/year\/(\d{4})\/.>\d{4}<\/a>\)<\/span>\s*<\/h1>/.exec(body)) {
				title.year = parseInt(m[1]);
			}

			// Rating and vote count
			m = /title=.Users rated this ([^\/]+).10 \(([^v]+)/.exec(body);

			if (m) {
				title.rating = parseFloat(m[1]);
				title.votes = parseInt(m[2].replace(/[^\d]+/g, ''));
			}

			// Cover
			if (m = /src=.(h[^"]+).\s*[^<]+itemprop=.image/.exec(body)) {
				title.cover = m[1];
			}

			// The first match is conveniently the most recent (highest number) season.
			if (m = /href=.episodes\?season=(\d+)/.exec(body)) {
				title.seasons = parseInt(m[1]);
			}

			var tvheader = /<h2\s+class=.tv_header.>\s*<a\s+href=.\/title\/(tt[^\/]+)\/.\s*>\s*([^<]+)<\/a>/.exec(body);

			if (tvheader) {
				title.show = {
					id: tvheader[1],
					name: htmlDecode(tvheader[2]).trim()
				};
			}

			// Season and episode number.
			if (m = /<span\sclass=.nobr.>Season\s(\d+), Episode\s(\d+)\s*<\/span>\s*<\/h2/.exec(body)) {
				title.season = parseInt(m[1]);
				title.episode = parseInt(m[2]);
			}

			// Hardcore
			new htmlparser.Parser(new htmlparser.DefaultHandler(function(err, dom) {
				if (err) return callback(err);

				// Description
				var desc = select(dom, 'p[itemprop="description"]');
				if (desc.length) title.synopsis = htmlDecode(desc[0].children[0].raw.replace(/\n/g, ''));

				// Genres
				_.each(select(dom, '.infobar a[href^="/genre/"]'), function(genre) {
					if (!title.genres) title.genres = [];

					title.genres.push(htmlDecode(genre.children[0].raw));
				});

				callback(null, title);
			})).parseComplete(body)
		});
	},

	episodes: function(id, season, callback) {
		if (_.isNull(callback)) {
			throw new Error('callback not specified');
		}

		if (!id || !/tt\d+/.test(id)) {
			return callback(new Error('invalid imdb id format'));
		}

		if (typeof season != 'number' || season == 0 || season < -1) {
			return callback(new Error('invalid season number'));
		}

		var url = util.titleUrl(id) + 'episodes/_ajax?season=' + season;

		request({ url: url, timeout: exports.timeout, headers: { "Accept-Language": module.exports.language } }, function(err, res, body) {
			if (err) {
				return callback(err);
			}

			if (res.statusCode == 500) {
				return callback(new Error('imdb server error, possibly invalid imdb id'));
			}

			if (res.statusCode != 200) {
				return callback(new Error('status code ' + res.statusCode + ' from imdb'));
			}

			var epm = /numberofEpisodes.\s+content=.(\d+)/.exec(body);

			if (!epm) {
				return callback(new Error('response from imdb failed sanity check'));
			}

			var expectedEpisodes = parseInt(epm[1]);

			var m, re = /meta\sitemprop=.episodeNumber.\scontent=.(\d+).\/>\s*<div\sclass=.airdate.>\s*([^<]+)\s*<\/div>\s*<strong><a\sonclick=.[^;]+..\s*href=.\/title\/(tt\d+)\/[^>]+>([^<]+)/g;
			var episodes = [];

			var convertImdbDate = function(x) {
				var dt = new Date(x);
				var yyyy = dt.getFullYear().toString();
				var mm = (dt.getMonth()+1).toString();
				var dd  = dt.getDate().toString();

   				return yyyy + '-' + (mm[1]?mm:"0"+mm[0]) + '-' + (dd[1]?dd:"0"+dd[0]);
			};			

			while (m = re.exec(body)) {
				var episode = {
					number: parseInt(m[1]),
					id: m[3],
					name: htmlDecode(m[4]).trim()
				};

				if (!/Unknown/.test(m[2])) {
					episode.airDate = convertImdbDate(m[2].trim());
				}

				episodes.push(episode);
			}

			if (expectedEpisodes != episodes.length) {
				return callback(new Error('expected ' + expectedEpisodes + ' and parsed ' + episodes.length));
			}

			callback(null, episodes);
		});
	}
};
