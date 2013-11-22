/// <reference path='../typedefs/node.d.ts' />

var _            = require('lodash'),
    fs           = require('fs'),
    argv         = require('optimist').argv,
    mkdirp       = require('mkdirp');

interface SponsorAddress {
  ip: string
  port: Number 
}

interface ConfigData {
  sponsor: SponsorAddress
  controlChannelPort: Number
}

class Config {
  private _userHome = process.env[(process.platform == 'win32') ? 'USERPROFILE' : 'HOME']; 
  private _configData:ConfigData = {
    sponsor: null,
    controlChannelPort:null 
  };
   
  private _configDir = this._userHome + '/.lantern';
  
  // Location where we store our configurations
  get configDir() { return this._configDir; }
  
  get configFile() { return this._configDir + '/config.json'; }
  
  // The address of the Lantern server that's sponsoring us (connecting us to the
  // rest of the Lantern network).
  get sponsor() { return this._configData.sponsor; }
  
  // The port on which we will listen for control channel connections from peers
  get controlChannelPort() { return this._configData.controlChannelPort || 16353; }
  
  constructor() {
    if (argv._.length === 1) {
      // Different configuration directory specified
      this._configDir = argv._[0];
      if (this._configDir.indexOf('/') != 0) {
        // Relative path provided, resolve relative to working directory
        this._configDir = process.cwd() + '/' + this._configDir; 
      }
    }
    
    // Always make config directory just in case
    try {
      mkdirp.sync(this._configDir);
    } catch(error) {
      console.log("Couldn't make configDir.  Maybe it already exists?", error);
    }
    
    // Load the config
    try {
      var configString = fs.readFileSync(this.configFile, {encoding: 'utf8'});
      _.merge(this._configData, JSON.parse(configString));
    } catch(error) {
      console.error('Unable to read config from: ' + this.configFile + '   using default instead', error);
    }
  }
}

module.exports = new Config();