var DEBUG = 1 /* 0 or 1 */;

var net = require('net');

var config = require('./config')
var proxy_hosts = config.proxy_hosts;

function mk_server(local_port, remote_addr, remote_port){
    var server = net.createServer(function(socket){
        
        if (DEBUG) console.log("> New connection from ip: " + socket.remoteAddress);
        
        /* building remote connection */
        var r_conn = net.createConnection(remote_port, remote_addr);
        r_conn.on('connect', function(){
    		console.log('connect remote ' + remote_addr + ':' + remote_port)
    	});
    	r_conn.on('data', function(data){
                    socket.write(chunk);
        });
    	r_conn.on('error', function(d){
    		console.log('remote socket error:' + d)
    		socket.destroy();	
        }); 
    	r_conn.on('end', function(){
    		socket.destroy();
    	});
        
        /* bind local socket event */
        socket.on("data", function(chunk){
	        r_conn.write(chunk);
	    });
        socket.on("close", function(){
            if (DEBUG) console.log("> Connection with ip: " + socket.remoteAddress + " just closed <");
            r_conn.destroy();
        });

    });
    console.log("Starting TCP server on port: " + local_port);
    server.listen(local_port);
    return server;
}

var server_list = new Array();
for(var j=0; j<proxy_hosts.length; j++){
    var h = proxy_hosts[j];
    var lport = process.env['PORT_SERVER_' + j] || (4242 + j);
    console.log("making proxy for " + h[0] + ":" + h[1] + " on port " + lport);
    var sv = mk_server(lport, h[0], h[1]);
    server_list[j] = sv;
}


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
http.get('/q/', function(req, res){
    var d = {};
    for(var j=0; j<proxy_hosts.length; j++){
        var h = proxy_hosts[j];
        d[j + ':' + h[0]] = {'0': h[1], '1': process.env['DOTCLOUD_TCP_SERVER_' + j + '_PORT']};
    }
    res.json(d);
});

http.listen(process.env['PORT_NODEJS'] || 8080);
