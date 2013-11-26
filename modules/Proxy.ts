/// <reference path='../d.ts/DefinitelyTyped/node/node.d.ts' />
/// <reference path='../typedefs/deferred.d.ts' />

// See class Proxy for entry point

// Node imports
var bouncy         = require('bouncy'),
    net            = require('net'),
    http           = require('http'),
    url            = require('url'),
    deferred       = require('deferred');

/**
 * An HTTP(S) proxy server
 */
class Proxy {
  private _server;
  
  constructor() {
    this._server = bouncy(function (req, res, bounce) {
      bounce(req.url);
    });
    
    this._server.on('connect', function(req, clientSocket, head) {
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
                           'Proxy-agent: Lantenr\r\n' +
                           '\r\n');
      });
    });
  }
  
  /**
   * Start the proxy server on the given port and optionally host.
   * 
   * If no host is specified, the proxy listens on all local interfaces.
   * 
   * @returns a promise 
   */
  start(port: Number, host?: string):Promise {
    var result = deferred();
    this._server.listen(port, host, function(error) {
      if (!error) {
        console.log('Proxy listening at ' + host + ':' + port);
        result.resolve();
      } else {
        result.reject(error);
      }
    });
    return result.promise;  
  }
}

export = Proxy;