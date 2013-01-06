var express = require('express');
var http = express();
var config = require('./config');
var proxy_hosts = config.proxy_hosts;

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

http.listen(8081);
