var fs = require('fs');
var http    = require('http');

//var datapath = '/home/finn/testdata/';

exports.dronedata = function(datapath) {
	var _this = this;
	this.png
	this.status;


	setInterval(function() {
		fs.readFile(datapath + 'status.txt', function (err, data) {
		  if (err)
		    throw err;
		  if (data)
		    _this.status = data.toString('utf8');
		});

		fs.readFile(datapath + 'camera.png', function(err, data) {
			if(err)
				throw err;
			if (data)
				_this.png = data;
		})
	}, 1000);

	return this;
};


// // For testing the png
// var server = http.createServer(function(req, res) {
// 	if(!png) res.end("Nope");
//   	res.writeHead(200, {'Content-Type': 'image/png'});

//   	res.end(png);
// });

// server.listen(8080, function() {
//   console.log('Serving latest png on port 8080 ...');
// });