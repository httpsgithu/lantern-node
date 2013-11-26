/// <reference path='../d.ts/DefinitelyTyped/node/node.d.ts' />
/// <reference path='../typedefs/deferred.d.ts' />
/// <reference path='config.ts' />

// See class ControlChannel for entry point.

// Node Imports
var https              = require('https'),
    deferred           = require('deferred');

// TypeScript Imports
import Config = require('./Config');
import Keys = require('./Keys');

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
    var port = Config.instance.controlChannelPort;
    var result = deferred();
    https.createServer({ key: Keys.instance.privateKey, cert: Keys.instance.certificate }, function(req, res) {
      res.end("o hai!")
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
}

// Singleton instance
export var instance = new ControlChannel();