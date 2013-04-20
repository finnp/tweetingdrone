var fs = require('fs');
tweetingdrone = require('./tweetingdrone').tweetingdrone;
var td = new tweetingdrone();
//td.getMentions();
td.setupStream();
//td.tweetImage({status: 'test', in_reply_to: '325574939467997184'}, 'logo.png');


var statusFile ='/home/finn/testdata/status.txt'

fs.watchFile(statusFile, function(curr, prev) {
	//console.log(curr);
	fs.readFile(statusFile, function(err, data) {
		td.tweetImage(data.toString('utf8'),'logo.png');		
	})
});
