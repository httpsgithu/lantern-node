/// <reference path="typedefs/node.d.ts" />
var https = require('https'), keys = require('./modules/keys'), controlChannel = require('./modules/controlchannel');

keys.init().then(controlChannel.start).done();
