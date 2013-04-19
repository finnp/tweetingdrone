// Twitter limits: https://dev.twitter.com/docs/rate-limiting/1.1/limits

var cred = require('./cred.js'); 


var request = require('request');
var qs = require('querystring');
var twitter = require('twitter'); // https://github.com/jdub/node-twitter



var oauth = {
	'consumer_key': cred.CONSUMER_KEY,
	'consumer_secret': cred.CONSUMER_SECRET,
	'token': cred.ACCESS_TOKEN,
	'token_secret': cred.ACCESS_SECRET
}

var twit = new twitter({
	'consumer_key': cred.CONSUMER_KEY,
	'consumer_secret': cred.CONSUMER_SECRET,
	'access_token_key': cred.ACCESS_TOKEN,
	'access_token_secret': cred.ACCESS_SECRET
});


var buildURL = function(endpoint, params) {
	// endpoint tweeting statuses/update.json
	var url = 'https://api.twitter.com/1.1/';
	url +=  endpoint + '?';
	url += qs.stringify(params);
	return url;
};


var tweet = function(status) {
	var url = buildURL('statuses/update.json', {
		status: status
	});

	request.post({url: url, oauth: oauth}, function (error, response, body) {
  		if (!error && response.statusCode == 200) {
    		console.log("Tweeted: " + JSON.parse(body).text);
  		} else {
  			console.log(response.statusCode);
  			console.log(response);
  		}
	});
};

var lastTweetId = '325336774140387328';
var getMentionsBlocked = false;

var getMentions = function() {
	// We want to make sure to only get each tweet once (?)
	if(getMentionsBlocked) {
		console.log("Error getMentions is currently working.")
		return
	}
	getMentionsBlocked = true;

	var url = buildURL('statuses/mentions_timeline.json', {
		count: 10,
		since_id: lastTweetId
	});


	request.get({url: url, oauth: oauth}, function(error, response, body) {
		if(!error && response.statusCode == 200) {
			var json = JSON.parse(body);
			if(json.length > 0) {
				lastTweetId = json[0]['id_str'];
				json.forEach(function(tweet){
						console.log("Mentioned: " + tweet.text);
				});
			} else {
				console.log("No new tweet.")
			}
		} else {
			console.log ("Error retrieving mentions.");
			console.log(body);
		}
		getMentionsBlocked = false; // Open for next request
	})

};


// tweet('Status ' + Date.now() + ': Not flying.'); // Problem with exclamation mark! (?)

// Check mentions: Only 15 per 15 minutes!
// Otherwise Stream API??

// setInterval(function(){
// 	getMentions();
// }, 1000)

// ############# STREAMING API #########
// {track:'@saunadrone'}
twit.stream('user', {track:'@saunadrone'}, function(stream) {
  stream.on('data', function (data) {
    console.log(data.text);
  });
});