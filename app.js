// Including libraries

var app = require('http').createServer(handler),
	io = require('socket.io').listen(app),
	static = require('node-static'); // for serving files

// This will make all the files in the current folder
// accessible from the web
var fileServer = new static.Server('./public');

// This is the port for our web server.
// you will need to go to http://localhost:8080 to see it
app.listen(8080);

// If the URL of the socket server is opened in a browser
function handler (request, response) {

	request.addListener('end', function () {
        fileServer.serve(request, response); // this will return the correct file
    });
}

// Delete this row if you want to see debug messages
//io.set('log level', 1);

// Listen for incoming connections from clients
io.sockets.on('connection', function (socket) {
	var id; 

	socket.on('newPlayer', function(data){
		id = data.id;
	});

	// Start listening for mouse move events
	socket.on('updatePosition', function (data) {

		// This line sends the event (broadcasts it)
		// to everyone except the originating client.
		socket.broadcast.emit('updatePosition', data);
	});
	
	socket.on('newLaser', function (data) {
		socket.broadcast.emit('newLaser', data);
	});
	
	
	socket.on('disconnect', function(){
		io.sockets.emit('playerDisconnected', id);
	});
});

