/// <reference path='../d.ts/DefinitelyTyped/node/node.d.ts' />
/// <reference path='../typedefs/deferred.d.ts' />

// See class Keys for starting point

var deferred = require('deferred'),
    _fs      = require('fs'),
    fs       = {
                 readFile: deferred.promisify(_fs.readFile),
                 writeFile: deferred.promisify(_fs.writeFile)
               },
    mkdirp   = require('mkdirp'),
    _pem     = require('pem'),
    pem      = {
                 createCertificate: deferred.promisify(_pem.createCertificate)
               },
    config   = require('./config');

/**
 * Handles key management for a Lantern instance.
 */
export class Keys {
  // Array of trusted certificate authorities
  private _certificateAuthorities: string[] = [];
  // Path to certificate signing request file
  private _csrFile: string;
  // Path to private key file
  private _privateKeyFile: string;
  // Path to certificate file
  private _certificateFile: string;
  
  // Certificate signing request
  private _csr: string;
  get csr() { return this._csr; }
  
  // PEM encoded private key
  private _privateKey: string;
  get privateKey() { return this._privateKey; }
  
  // PEM encoded certificate
  private _certificate: string;
  get certificate() { return this._certificate; }
  
  constructor() {
    var keysDir = config.configDir + '/keys/';
    this._csrFile = keysDir + 'csr.csr';
    this._privateKeyFile = keysDir + 'privatekey.pem';
    this._certificateFile = keysDir + 'certificate.pem';
    
    // Always make the keysDir
    try {
      mkdirp.sync(keysDir);
    } catch (error) {
    }
  }
  
  /**
   * Asynchronously initialize Keys with an array of certificate authorities
   * that we should trust.
   * 
   * @returns a Promise for finding out when initialization is finished 
   */
  init(certificateAuthorities: string[] = []):Promise {
    console.log('Initializing keys');
    this._certificateAuthorities = certificateAuthorities;
    var self = this;
    var result = deferred();
    
    this._readKeyData()
        .then(this.createKeyDataIfNecessary.bind(this))
        .done(function() {
          result.resolve()
        }, function(error) {
          console.log('Unable to create key data: ', error);
          result.reject(error);
        });
    
    return result.promise;
  }
  
  private _readKeyData():Promise {
    var result = deferred();
    
    deferred.map([this._csrFile, this._privateKeyFile, this._certificateFile], function(filename) {
      return fs.readFile(filename, {encoding: 'utf8'});
    })
      .then(this.captureKeyData.bind(this))
      .done(function(data) {
        result.resolve(true);
      }, function(error) {
        result.resolve(false);
      });
    
    return result.promise;
  }
  
  private captureKeyData(data):void {
    console.log('Using key data from disk');
    this._csr = data[0];
    this._privateKey = data[1];
    this._certificate = data[2];
  }
  
  private createKeyDataIfNecessary(keyDataFound):Promise {
    if (!keyDataFound) {
      console.log('Key data not found on disk, creating ...');
      var shouldSelfSign = !config.sponsor;
      if (shouldSelfSign) {
        console.log('No sponsor, signing our own certificate');
      }
      return pem.createCertificate({keyBitsize: 2048, selfSigned: shouldSelfSign})
                .then(this.saveCSR.bind(this))
                .then(this.savePrivateKey.bind(this))
                .then(this._saveCertificate.bind(this));
    }
  }
      
  private saveCSR(certData):Promise {
    this._csr = certData.csr;
    this._privateKey = certData.clientKey;
    this._certificate = certData.certificate;
    return fs.writeFile(this._csrFile, this._csr);
  }
  
  private savePrivateKey():Promise {
    return fs.writeFile(this._privateKeyFile, this._privateKey); 
  }
  
  private _saveCertificate():Promise {
    return fs.writeFile(this._certificateFile, this._certificate);
  }
}
      
export var instance = new Keys();