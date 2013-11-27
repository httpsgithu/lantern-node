/// <reference path='../d.ts/DefinitelyTyped/node/node.d.ts' />
/// <reference path='../typedefs/deferred.d.ts' />
/// <reference path='config.ts' />

// See class ControlChannel for entry point.

// Node Imports
var http               = require('http'),
    https              = require('https'),
    url                = require('url'),
    deferred           = require('deferred');

// TypeScript Imports
import Config = require('./Config');
var config = Config.instance;
import Keys = require('./Keys');
var keys = Keys.instance;

/**
 * Encapsulates a websockets based control channel for exchanging presence
 * notifications and other signalling information with this Lantern instance.
 */
export class ControlChannel {
  /**
   * Start the control channel.
   * 
   * @returns a Promise for finding out when starting has finished
   */
  start():Promise {
    return this._startAuthenticationServer()
      .then(this._startControlChannelServer.bind(this));
  }
  
  _startAuthenticationServer():Promise {
    var result = deferred();
    
    var port = config.controlChannelPort + 1;
    var serverOptions = {
      key: keys.privateKey,
      cert: keys.certificate
    };
    https.createServer(serverOptions, (req, res) => {
      var path = this._pathForRequest(req);
      console.log("Path:", path);
      if (path.indexOf('authenticate') === 0) {
        return this._authenticate(req, res);
      }
    }).listen(port, function(err) {
      if (err) {
        result.reject('Unable to start control channel server: ' +  err);
      } else {
        console.log('Listening for authentication requests on port', port);
        result.resolve();
      }
    });
    
    return result.promise;
  }
  
  _startControlChannelServer():Promise {
    var result = deferred();
    
    var port = config.controlChannelPort;
    var serverOptions = {
      key: keys.privateKey,
      cert: keys.certificate,
      ca: [keys.certificate],
      requestCert: true,
      rejectUnauthorized: true
    };
    https.createServer(serverOptions, (req, res) => {
      var path = this._pathForRequest(req);
      console.log(req.connection.getPeerCertificate());
      console.log(req.secure);
      console.log(req.client.authorized);
    }).listen(port, function(err) {
      if (err) {
        result.reject('Unable to start control channel server: ' +  err);
      } else {
        console.log('Listening for control channel traffic on port', port);
        result.resolve();
      }
    });
    
    return result.promise;
  }
  
  requestAuthentication():Promise {
    var result = deferred();
    var sponsor = config.sponsor;
    if (!sponsor) {
      console.log('No sponsor configured, skipping authentication');
      result.resolve();
    } else {
      var options = {
        // TODO: actually check the server's certificate against our trusted ones
        host: sponsor.ip,
        port: sponsor.port + 1,
        path: '/authenticate',
        method: 'POST',
        key: keys.privateKey,
        cert: keys.certificate,
        ca: keys.trustedCertificates,
        rejectUnauthorized: true
      };
      var req = https.request(options, function(res) {
        var cert = '';
        res.on('data', function (data) {
            cert += data;
        });
        res.on('end', function () {
            console.log('Got signed certificate');
            var newOptions = {
              // TODO: actually check the server's certificate against our trusted ones
              host: sponsor.ip,
              port: sponsor.port,
              path: '/',
              method: 'GET',
              key: keys.privateKey,
              cert: cert,
              ca: keys.trustedCertificates,
              rejectUnauthorized: true
            };
            var newReq = https.request(newOptions, function(res) {
              
            });
            newReq.on('error', function(error) {
              console.log(error);
            });
            newReq.end();
        });
      });
      req.write(keys.certificate);
      req.end();
    }
    return result.promise;
  }
  
  private _authenticate(req, res):Promise {
    var result = deferred();
    var cert = '';
    req.on('data', function (data) {
        cert += data;
    });
    req.on('end', function () {
        res.write(keys.sign(cert));
        res.end();
    });
    result.resolve();
    return result;
  }
  
  private _pathForRequest(req):string {
    var parsedUrl = url.parse(req.url);
    return this._stripTrailingSlash(parsedUrl.pathname.substring(1));
  }
  
  private _stripTrailingSlash(str):string {
    if (str.substr(-1) == '/') {
      return str.substr(0, str.length - 1);
    }
    return str;
  }
}

// Singleton instance
export var instance = new ControlChannel();