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
    var port = config.controlChannelPort;
    var result = deferred();
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
        console.log('Control channel listening on port', port);
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
        port: sponsor.port,
        path: '/authenticate',
        method: 'POST',
        key: keys.privateKey,
        cert: keys.certificate,
        ca: keys.trustedCertificates,
        rejectUnauthorized: true
      };
      var req = https.request(options, function(res) {
        console.log('Finished');
      });
      req.end();
    }
    return result.promise;
  }
  
  private _authenticate(req, res):Promise {
    var result = deferred();
    //console.log(req.connection.getPeerCertificate());
    console.log(req.secure);
    console.log(req.client.authorized);
    result.resolve();
    res.end();
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