/// <reference path="typedefs/node.d.ts" />

var https          = require('https'),
    keys           = require('./modules/keys'),
    controlChannel = require('./modules/controlchannel'),
    bouncy         = require('bouncy'),
    net            = require('net'),
    http           = require('http'),
    url            = require('url');

keys.init()
    .then(controlChannel.start)
    .done();

var server = bouncy(function (req, res, bounce) {
  bounce(req.url);
});

server.on('connect', function(req, clientSocket, head) {
  var serverUrl = url.parse('http://' + req.url);
  var serverSocket = net.connect(serverUrl.port, serverUrl.hostname, function() {
    clientSocket.write('HTTP/1.1 200 Connection Established\r\n' +
                    'Proxy-agent: Lantern\r\n' +
                    '\r\n');
    serverSocket.write(head);
    serverSocket.pipe(clientSocket);
    clientSocket.pipe(serverSocket);
  });  
  serverSocket.on('error', function(error) {
    console.log('Unable to connect to ' + serverUrl.hostname + ':' + serverUrl.port, error);
    clientSocket.write('HTTP/1.1 502 Bad Gateway\r\n' + 
                       'Proxy-agent: Lantenr\r\n' 
                       '\r\n');
  });
});

server.listen(8080);