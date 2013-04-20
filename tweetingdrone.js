// Twitter limits: https://dev.twitter.com/docs/rate-limiting/1.1/limits

var cred = require('./cred.js');
var fs = require('fs');
var https = require('https');
var OAuth = require('oauth').OAuth;
var request = require('request');
var qs = require('querystring');
var twitter = require('twitter'); // https://github.com/jdub/node-twitter

exports.tweetingdrone = function() {
	var _this = this;
	this.oauth = {
		'consumer_key': cred.CONSUMER_KEY,
		'consumer_secret': cred.CONSUMER_SECRET,
		'token': cred.ACCESS_TOKEN,
		'token_secret': cred.ACCESS_SECRET
	}

	this.buildURL = function(endpoint, params) {
		// endpoint tweeting statuses/update.json
		var url = 'https://api.twitter.com/1.1/';
		url +=  endpoint + '?';
		url += qs.stringify(params);
		return url;
	};

	this.tweet = function(params) {
		// status -> Text
		// in_reply_to_status_id -> Answers
		//console.log(params);
		var url = this.buildURL('statuses/update.json', params);
		request.post({url: url, oauth: this.oauth}, function (error, response, body) {
	  		if (!error && response.statusCode == 200) {
	    		console.log("Tweeted: " + JSON.parse(body).text);
	  		} else {
	  			console.log(response.statusCode);
	  			console.log(response);
	  		}
		});
	};

	// Let's use streaming API instead of getMentions.

	this.lastTweetId = '325336774140387328';
	this.getMentionsBlocked = false;

	this.getMentions = function() {
		// We want to make sure to only get each tweet once (?)
		if(this.getMentionsBlocked) {
			console.log("Error getMentions is currently working.")
			return
		}

		this.getMentionsBlocked = true;

		var url = this.buildURL('statuses/mentions_timeline.json', {
			count: 10,
			since_id: this.lastTweetId
		});

		request.get({url: url, oauth: this.oauth}, function(error, response, body) {
			if(!error && response.statusCode == 200) {
				var json = JSON.parse(body);
				if(json.length > 0) {
					_this.lastTweetId = json[0]['id_str'];
					json.forEach(function(tweet){
							console.log("Mentioned: " + tweet.text);
					});
					//_this.tweet({status: 'Status ' + Date.now() + ': Not flying.'}); // Problem with exclamation mark! (?)
				} else {
					console.log("No new tweet.")
				}
			} else {
				console.log ("Error retrieving mentions.");
				console.log(body);
			}
			_this.getMentionsBlocked = false; // Open for next request
		})
	};

	this.tweetImage = function(tweet, fileName) {
		var oa = new OAuth(
    	'https://api.twitter.com/oauth/request_token',
    	'https://api.twitter.com/oauth/access_token',
    	cred.CONSUMER_KEY, cred.CONSUMER_SECRET,
    	'1.0', null, 'HMAC-SHA1'
    );
		var data = fs.readFileSync(fileName);
		var crlf = "\r\n";
		var boundary = '---------------------------10102754414578508781458777923';

		var separator = '--' + boundary;
		var footer = crlf + separator + '--' + crlf;
		var fileHeader = 'Content-Disposition: file; name="media"; filename="' + fileName + '"';

		var contents = separator + crlf
	    + 'Content-Disposition: form-data; name="status"' + crlf
	    + crlf
	    + tweet + crlf
	    + separator + crlf
	    + fileHeader + crlf
	    + 'Content-Type: image/png' +  crlf
	    + crlf;

		var multipartBody = Buffer.concat([
	    new Buffer(contents),
	    data,
	    new Buffer(footer)
	  ]);

		var hostname = 'upload.twitter.com';
		var accessToken = cred.ACCESS_TOKEN;
		var tokenSecret = cred.ACCESS_SECRET;
		
		var authorization = oa.authHeader(
	    'https://upload.twitter.com/1/statuses/update_with_media.json',
	    accessToken,
	    tokenSecret,
	    'POST'
	  );

		var headers = {
		    'Authorization': authorization,
		    'Content-Type': 'multipart/form-data; boundary=' + boundary,
		    'Host': hostname,
		    'Content-Length': multipartBody.length,
		    'Connection': 'Keep-Alive'
		};

		var options = {
		    host: hostname,
		    port: 443,
		    path: '/1/statuses/update_with_media.json',
		    method: 'POST',
		    headers: headers
		};

		var request = https.request(options);

		request.on('error', function (err) {
		    console.log('Error: Something is wrong.\n'+JSON.stringify(err)+'\n');
		});

		request.on('response', function (response) {            
		    response.setEncoding('utf8');            
		    response.on('data', function (chunk) {
		        console.log(chunk.toString());
		    });
		    response.on('end', function () {
		        console.log(response.statusCode +'\n');
		    });
		});
		request.write(multipartBody);
		request.end();
	};

	// 
	this.onStreamData = function(data) {
		console.log('onStreamData');
		if(data.text) {
  		console.log(data.text);
  		if(data.user.screen_name !== 'saunadrone') {
	  		var status = '@' + data.user.screen_name + ' I am not flying, yet.'
		    _this.tweet({
		    	status: status,
		    	in_reply_to_status_id: data['id_str']
		    })  			
  		}
  	}
	};

	// ############# STREAMING API #########
	this.setupStream = function() {
		var twit = new twitter({ // Could also be used for the basic stuff
			'consumer_key': cred.CONSUMER_KEY,
			'consumer_secret': cred.CONSUMER_SECRET,
			'access_token_key': cred.ACCESS_TOKEN,
			'access_token_secret': cred.ACCESS_SECRET
		});
		
		twit.stream('user', {track:'@saunadrone'}, function(stream) {
			console.log('stream created', stream);
		  stream.on('data', _this.onStreamData);
		});
	};
}