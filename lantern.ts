/// <reference path='d.ts/DefinitelyTyped/node/node.d.ts' />
/// <reference path='typedefs/deferred.d.ts' />

// Node imports
var https                         = require('https');

// TypeScript imports
import ControlChannel = require('modules/ControlChannel');
import Keys           = require('modules/Keys');
import Proxy          = require('modules/Proxy');

Keys.instance.init()
             .then(ControlChannel.instance.start)
             .then(new Proxy().start(8080, '127.0.0.1'))
             .done();

