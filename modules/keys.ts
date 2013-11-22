/// <reference path='../typedefs/node.d.ts' />

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

class Keys {
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
  
  constructor(public certificateAuthorities: string[] = []) {
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
  
  init() {
    console.log('Initializing keys');
    var self = this;
    var result = deferred();
    
    this.readKeyData()
        .then(this.createKeyDataIfNecessary.bind(this))
        .done(function() {
          result.resolve()
        }, function(error) {
          console.log('Unable to create key data: ', error);
          result.reject(error);
        });
    
    return result.promise;
  }
  
  private readKeyData() {
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
  
  private captureKeyData(data) {
    console.log('Using key data from disk');
    this._csr = data[0];
    this._privateKey = data[1];
    this._certificate = data[2];
  }
  
  private createKeyDataIfNecessary(keyDataFound) {
    if (!keyDataFound) {
      console.log('Key data not found on disk, creating ...');
      var shouldSelfSign = !config.sponsor;
      if (shouldSelfSign) {
        console.log('No sponsor, signing our own certificate');
      }
      return pem.createCertificate({keyBitsize: 2048, selfSigned: shouldSelfSign})
                .then(this.saveCSR.bind(this))
                .then(this.savePrivateKey.bind(this))
                .then(this.saveCertificate.bind(this));
    }
  }
      
  private saveCSR(certData) {
    this._csr = certData.csr;
    this._privateKey = certData.clientKey;
    this._certificate = certData.certificate;
    return fs.writeFile(this._csrFile, this._csr);
  }
  
  private savePrivateKey() {
    return fs.writeFile(this._privateKeyFile, this._privateKey); 
  }
  
  private saveCertificate() {
    return fs.writeFile(this._certificateFile, this._certificate);
  }
}
      
module.exports = new Keys();