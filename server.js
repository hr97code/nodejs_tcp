var DEBUG = 1 /* 0 or 1 */;

var net = require('net');

var port = process.env['PORT_SERVER'] || 4242;

var config = require('./config')
var REMOTE_ADDR = config.REMOTE_SERVER_ADDR;
var REMOTE_PORT = config.REMOTE_SERVER_PORT;

var server = net.createServer(function(socket){

    var data = function(chunk){
	  	if (DEBUG){
				console.log("> Data received from from ip: " + socket.remoteAddress);
				console.log("-------------------------");
				console.log(chunk.toString());
				console.log("-------------------------");
		}
		if (!REMOTE_ADDR || !REMOTE_PORT ){
			if(DEBUG){
				console.log("Nothing to proxy");
			}
			socket.write('?');
		}else{
			var serviceSocket = new net.Socket();
			serviceSocket.connect(parseInt(REMOTE_PORT), REMOTE_ADDR, function () {
				if(DEBUG)
					console.log('>> From proxy to remote', msg.toString());
				serviceSocket.write(msg);
			});
			serviceSocket.on("data", function (data) {
				if(DEBUG)
					console.log('<< From remote to proxy and to client', data.toString());
				socket.write(data);
			});
		}
    };

    var close = function(){
		if (DEBUG){
			console.log("> Connection with ip: " + socket.remoteAddress + " just closed <");
		}
    };
	
	if (DEBUG){
		console.log("> New connection from ip: " + socket.remoteAddress);
	}
    socket.on("data", data);
    socket.on("close", close);
});


console.log("Starting TCP server on port: " + port);
server.listen(port);


/* A HTTP server just for info purposes */

var express = require('express');
var http = express();

http.get('/', function(req, res){
    res.json({
		hi: 'hello world!'
		/*
        host: process.env['DOTCLOUD_TCP_SERVER_HOST'],
        port: process.env['DOTCLOUD_TCP_SERVER_PORT'],
        help: "telnet "+ process.env['DOTCLOUD_TCP_SERVER_HOST'] + " " + process.env['DOTCLOUD_TCP_SERVER_PORT'], 
		env: process.env*/
    });
});

http.listen(process.env['PORT_NODEJS'] || 8080);
