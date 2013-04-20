var io = require('socket.io').listen(8080);

io.sockets.on('connection', function(socket){
	setTimeout(function(){
		socket.emit('message', 'I am tweeting through sockets.');
	}, 5000)
	
});