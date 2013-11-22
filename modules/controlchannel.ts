/// <reference path='../typedefs/node.d.ts' />

var keys     = require('./keys'),
    https    = require('https'),
    deferred = require('deferred'),
    config   = require('./config');

class ControlChannel {
   start() {
     var port = config.controlChannelPort;
     var result = deferred();
     https.createServer({key: keys.privateKey, cert: keys.certificate}, function(req, res){
        res.end("o hai!")
     }).listen(port, function(err) {
       if (err) {
         result.reject('Unable to start control channel server: ', err);
       } else {
         console.log('Control channel listening on port', port);
         result.resolve();
       }
     });
     return result.promise;
   }
}

module.exports = new ControlChannel();