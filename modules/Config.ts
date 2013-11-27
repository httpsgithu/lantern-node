/// <reference path='../d.ts/DefinitelyTyped/node/node.d.ts' />

// See class Config for main entry point.

// Node imports
var _            = require('lodash'),
    fs           = require('fs'),
    argv         = require('optimist').argv,
    mkdirp       = require('mkdirp');

export interface SponsorAddress {
  ip: string;
  port: Number; 
}

export interface ConfigData {
  sponsor: SponsorAddress;
  controlChannelPort: Number;
  localProxyPort: Number;
}

/**
 * Encapsulates the configuration of the system.  There is only one instance
 * of Config for the entire system.
 * 
 * The configuration is read from/saved to a file located in the Lantern config
 * directory and named config.json.  The config directory defaults to
 * ~/.lantern, which means the config file is at ~/.lantern/config.json.
 * 
 * A different config directory can be given as the first command-line parameter
 * to lantern. 
 */
export class Config {
  private _userHome:string = process.env[(process.platform == 'win32') ? 'USERPROFILE' : 'HOME']; 
  
  private _configDir:string = this._userHome + '/.lantern';
  
  private _configData:ConfigData = {
    sponsor: null,
    controlChannelPort: 16300,
    localProxyPort: 8000 
  };
  
  /**
   * Location where we store our configurations.
   */
  get configDir():string { return this._configDir; }
  
  /**
   * Path to configuration file.
   */
  get configFile():string { return this._configDir + '/config.json'; }
  
  /**
   * The address of the Lantern server that's sponsoring us (connecting us to
   * the rest of the Lantern network).  By default, this is null.
   */
  get sponsor():SponsorAddress { return this._configData.sponsor; }
  
  /**
   * The port on which we will listen for control channel connections from
   * peers.  Defaults to 16353.
   */
  get controlChannelPort():Number { return this._configData.controlChannelPort; }
  
  /**
   * The port on which the local proxy listens for local connections. 
   * Defaults to 8080.
   */
  get localProxyPort():Number { return this._configData.localProxyPort; }
  
  constructor() {
    if (argv._.length === 1) {
      // Different configuration directory specified
      this._configDir = argv._[0];
      if (this._configDir.indexOf('/') != 0) {
        // Relative path provided, resolve relative to working directory
        this._configDir = process.cwd() + '/' + this._configDir; 
      }
    }
    
    console.log('Using configDir', this._configDir);
    
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
      console.log('Loaded config from: ', this.configFile);
    } catch(error) {
      console.error('Unable to read config from: ' + this.configFile + '   using default instead', error);
      this._save();
    }
  }
  
  /**
   * Asynchronously save this configuration back to the config file.
   */
  private _save():void {
    fs.writeFile(this.configFile, JSON.stringify(this._configData), function(err) {
      console.warn('Unable to save configuration', err);
    }); 
  }
}

// Singleton Instance
export var instance = new Config();