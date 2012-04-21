var imdb = require('./imdb');

// Look up the show Warehouse 13 and the the last episode 
// of the second to last season.
imdb.title('tt1132290', function(err, show) {
	console.log(show);

	imdb.episodes(show.id, show.seasons - 1, function(err, episodes) {
		imdb.title(episodes[episodes.length - 1].id, function(err, episode) {
			console.log(episode);
		});
	});
});
