/// <reference path='../typedefs/node.d.ts' />
var _ = require('lodash'), fs = require('fs'), argv = require('optimist').argv, mkdirp = require('mkdirp');

var Config = (function () {
    function Config() {
        this._userHome = process.env[(process.platform == 'win32') ? 'USERPROFILE' : 'HOME'];
        this._configData = {
            sponsor: null,
            controlChannelPort: null
        };
        this._configDir = this._userHome + '/.lantern';
        if (argv._.length === 1) {
            // Different configuration directory specified
            this._configDir = argv._[0];
            if (this._configDir.indexOf('/') != 0) {
                // Relative path provided, resolve relative to working directory
                this._configDir = process.cwd() + '/' + this._configDir;
            }
        }

        try  {
            mkdirp.sync(this._configDir);
        } catch (error) {
            console.log("Couldn't make configDir.  Maybe it already exists?", error);
        }

        try  {
            var configString = fs.readFileSync(this.configFile, { encoding: 'utf8' });
            _.merge(this._configData, JSON.parse(configString));
        } catch (error) {
            console.error('Unable to read config from: ' + this.configFile + '   using default instead', error);
        }
    }
    Object.defineProperty(Config.prototype, "configDir", {
        get: // Location where we store our configurations
        function () {
            return this._configDir;
        },
        enumerable: true,
        configurable: true
    });

    Object.defineProperty(Config.prototype, "configFile", {
        get: function () {
            return this._configDir + '/config.json';
        },
        enumerable: true,
        configurable: true
    });

    Object.defineProperty(Config.prototype, "sponsor", {
        get: // The address of the Lantern server that's sponsoring us (connecting us to the
        // rest of the Lantern network).
        function () {
            return this._configData.sponsor;
        },
        enumerable: true,
        configurable: true
    });

    Object.defineProperty(Config.prototype, "controlChannelPort", {
        get: // The port on which we will listen for control channel connections from peers
        function () {
            return this._configData.controlChannelPort || 16353;
        },
        enumerable: true,
        configurable: true
    });
    return Config;
})();

module.exports = new Config();
