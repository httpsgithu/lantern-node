/// <reference path='d.ts/DefinitelyTyped/node/node.d.ts' />
/// <reference path='typedefs/deferred.d.ts' />

// Node imports
var https                         = require('https');

// TypeScript imports
import ControlChannel = require('modules/ControlChannel');
import Keys           = require('modules/Keys');
import Proxy          = require('modules/Proxy');
import Config         = require('modules/Config');

var keys = Keys.instance;
var controlChannel = ControlChannel.instance;
var config = Config.instance;

keys.init()
    .then(controlChannel.start.bind(controlChannel))
    .then(controlChannel.requestAuthentication.bind(controlChannel))
    .then(new Proxy().start(config.localProxyPort, '127.0.0.1'))
    .done();