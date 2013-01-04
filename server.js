var DEBUG = 1 /* 0 or 1 */;

var net = require('net');

var config = require('./config')
var proxy_hosts = config.proxy_hosts;

function mk_server(local_port, remote_addr, remote_port){
    var server = net.createServer(function(socket){
        
        var r_server = net.createServer(function(r_socket){
            var r_write = function(msg){
                r_socket.write(msg);
            }
            var r_data = function(chunk){
                if(DEBUG)
                    console.log('<< From remote to proxy and to client', data.toString());
                socket.write(chunk);
            }
            r_socket.on("data", r_data);
        });
        try{
            r_server.listen(remote_port, remote_addr);
        }catch(err){
            console.log("open remote socket error:" + err);
        }
        
        var data = function(chunk){
          	if (DEBUG){
                console.log("> Data received from from ip: " + socket.remoteAddress);
                console.log("-------------------------");
                console.log(chunk.toString());
                console.log("-------------------------");
    		}
    		if (!local_port || !remote_addr ){
    			if(DEBUG){
    				console.log("Nothing to proxy");
    			}
    			socket.write('?');
    		}else{
				if(DEBUG) console.log('>> From proxy to remote', chunk.toString());
				r_server.r_write(chunk);
    		}
        };
    
        var close = function(){
    		if (DEBUG) console.log("> Connection with ip: " + socket.remoteAddress + " just closed <");
            r_server.end();
            socket.destroy();
        };
    	
        if (DEBUG) console.log("> New connection from ip: " + socket.remoteAddress);
    	
        socket.on("data", data);
        socket.on("close", close);
    });
    console.log("Starting TCP server on port: " + local_port);
    server.listen(local_port);
    return server;
}

var server_list = new Array();
for(var j=0; j<proxy_hosts.length; j++){
    var h = proxy_hosts[j];
    var lport = process.env['PORT_SERVER_' + j] || (4242 + j);
    console.log("making proxy for " + h[0] + ":" + h[1] + " on port: " + lport);
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
        var h = proxy_host[j];
        d[j + ':' + h[0]] = {'0': h[1], '1': process.env['DOTCLOUD_TCP_SERVER_' + j + '_PORT']};
    }
    res.json(d);
});

http.listen(process.env['PORT_NODEJS'] || 8080);
