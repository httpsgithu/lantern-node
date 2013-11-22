/// <reference path='../typedefs/node.d.ts' />
var keys = require('./keys'), https = require('https'), deferred = require('deferred'), config = require('./config');

var ControlChannel = (function () {
    function ControlChannel() {
    }
    ControlChannel.prototype.start = function () {
        var port = config.controlChannelPort;
        var result = deferred();
        https.createServer({ key: keys.privateKey, cert: keys.certificate }, function (req, res) {
            res.end("o hai!");
        }).listen(port, function (err) {
            if (err) {
                result.reject('Unable to start control channel server: ', err);
            } else {
                console.log('Control channel listening on port', port);
                result.resolve();
            }
        });
        return result.promise;
    };
    return ControlChannel;
})();

module.exports = new ControlChannel();
