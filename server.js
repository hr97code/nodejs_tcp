var net = require('net');

var config = require('./config');
var DEBUG = config.debug;
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
                    socket.write(data);
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

//处理各种错误
process.on('uncaughtException', function(err)
{
    console.log("\nError!!!!");
    console.log(err);
});

var server_list = new Array();
for(var j=0; j<proxy_hosts.length; j++){
    var h = proxy_hosts[j];
    var lport = process.env['PORT_SERVER_' + j] || (4242 + j);
    console.log("making proxy for " + h[0] + ":" + h[1] + " on port " + lport);
    var sv = mk_server(lport, h[0], h[1]);
    server_list[j] = sv;
}

var httpProxy = require('./lib/node-http-proxy');
var http_proxy_route = config.http_proxy_route;
var proxy_local_port = process.env['PORT_NODEJS'] || 8080;

function starts_with(obj, s){
    return obj.indexOf(s) == 0;
} 

httpProxy.createServer(function (req, res, proxy) {
  var buffer = httpProxy.buffer(req);
  var _url = req.url;
  if (DEBUG) console.log("routing url:::" + _url);
  for(var k=0; k<http_proxy_route.length; k++){
      var d = http_proxy_route[k];
      var u = d[0], h = d[1], p = d[2], rset = d[3];
      if(starts_with(_url, u)){
          if (rset){
              var new_url = _url.substring(u.length);
              if (DEBUG) console.log("new url::" + new_url);
              if(new_url.substring(0,1) != '/'){
                new_url = '/' + new_url;
              }
              if (DEBUG) console.log("fix new url::" + new_url);
              req.url = new_url;
          }
          proxy.proxyRequest(req, res, {
            port: p,
            host: h,
            buffer: buffer
          });
          return;
      }
  }
  res.writeHead(200, { 'Content-Type': 'text/html' });
  res.write("404 not route");
  res.end();
}).listen(proxy_local_port);

require('./index');
