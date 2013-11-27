/// <reference path='../d.ts/DefinitelyTyped/node/node.d.ts' />
/// <reference path='../typedefs/deferred.d.ts' />

// See class Keys for starting point

// Node imports
var deferred = require('deferred'),
    _fs      = require('fs'),
    fs       = {
                 readFile: deferred.promisify(_fs.readFile),
                 writeFile: deferred.promisify(_fs.writeFile),
                 readdir: deferred.promisify(_fs.readdir)
               },
    mkdirp   = require('mkdirp'),
    forge    = require('node-forge'),
    pki      = forge.pki,
    rsa      = pki.rsa;
    
// Typescript imports
import Config = require('Config');
var config = Config.instance;

/**
 * Handles key management for a Lantern instance.
 */
export class Keys {
  // Array of trusted certificate authorities
  private _certificateAuthorities: string[] = [];
  // Path to private key file
  private _privateKeyFile: string;
  // Path to certificate file
  private _certificateFile: string;
  // Path to trusted certificates
  private _trustedCertificatesPath: string;
  
  // PEM encoded private key
  private _privateKey: string;
  get privateKey() { return this._privateKey; }
  
  // PEM encoded certificate
  private _certificate: string;
  get certificate() { return this._certificate; }
  
  // PEM encoded trusted certificates
  private _trustedCertificates: string[];
  get trustedCertificates() { return this._trustedCertificates; }
  
  constructor() {
    var keysDir = config.configDir + '/keys';
    this._privateKeyFile = keysDir + '/own/privatekey.pem';
    this._certificateFile = keysDir + '/own/certificate.pem';
    this._trustedCertificatesPath = keysDir + '/trusted/';
    
    // Always make the keysDir
    try {
      mkdirp.sync(keysDir + "/own");
      mkdirp.sync(keysDir + "/trusted");
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
    var result = deferred();
    
    this._readKeyData()
        .then(this._createKeyDataIfNecessary.bind(this))
        .then(this._readTrustedCertificates.bind(this))
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
    
    deferred.map([this._privateKeyFile, this._certificateFile], function(filename) {
      return fs.readFile(filename, {encoding: 'utf8'});
    })
      .then(this._captureKeyData.bind(this))
      .done(function(data) {
        result.resolve(true);
      }, function(error) {
        result.resolve(false);
      });
    
    return result.promise;
  }
  
  private _captureKeyData(data):void {
    console.log('Using key data from disk');
    this._privateKey = data[0];
    this._certificate = data[1];
  }
  
  private _createKeyDataIfNecessary(keyDataFound):Promise {
    if (!keyDataFound) {
      console.log('Key data not found on disk, creating ...');
      var result = deferred();
      var shouldSelfSign = !config.sponsor;
      rsa.generateKeyPair({ bits: 2048, workers: 2 }, (err, keypair) => {
        if (err) {
          result.reject('Unable to create key pair', err);
        } else {
          this._privateKey = pki.privateKeyToPem(keypair.privateKey);
          var cert = pki.createCertificate();
          cert.publicKey = keypair.publicKey;
          cert.serialNumber = '01';
          cert.validity.notBefore = new Date();
          cert.validity.notAfter = new Date();
          // Make certificate valid for one week
          cert.validity.notAfter.setTime(cert.validity.notAfter.getTime() + 7 * 24 * 60 * 60 * 1000);
          var attrs = [{
            name: 'commonName',
            value: 'lantern'
          }];
          cert.setSubject(attrs);
          cert.setIssuer(attrs);
          cert.setExtensions([{
            name: 'basicConstraints',
            cA: true
          }, {
              name: 'keyUsage',
              keyCertSign: true,
              digitalSignature: true,
              nonRepudiation: true,
              keyEncipherment: true,
              dataEncipherment: true
            }, {
              name: 'extKeyUsage',
              serverAuth: true,
              clientAuth: true,
              codeSigning: true,
              emailProtection: true,
              timeStamping: true
            }, {
              name: 'nsCertType',
              client: true,
              server: true,
              email: true,
              objsign: true,
              sslCA: true,
              emailCA: true,
              objCA: true
            }, {
              name: 'subjectAltName',
              altNames: [{
                type: 7,
                ip: '127.0.0.1'
              }]
            }, {
              name: 'subjectKeyIdentifier'
            }]);
          //if (shouldSelfSign) {
            // self-sign certificate
            cert.sign(keypair.privateKey);
          //}
          this._certificate = pki.certificateToPem(cert);
          result.resolve();
        }
      });
    
      return result.promise
                .then(this._savePrivateKey.bind(this))
                .then(this._saveCertificate.bind(this));
    }
  }
      
  private _savePrivateKey():Promise {
    return fs.writeFile(this._privateKeyFile, this._privateKey); 
  }
  
  private _saveCertificate():Promise {
    return fs.writeFile(this._certificateFile, this._certificate);
  }
  
  private _readTrustedCertificates():Promise {
    console.log("Reading trusted certificates");
    var result = deferred();
    fs.readdir(this._trustedCertificatesPath)
      .map((path) => {
         return fs.readFile(this._trustedCertificatesPath + '/' + path, 'utf8');
      })
      .then((trustedCertificates) => {
        console.log('Found ' + trustedCertificates.length + ' trusted certificates');
        this._trustedCertificates = trustedCertificates;
      })
      .done(function() {
        result.resolve();
      }, function(error) {
        console.log('Unable to read trusted certificates', error);
        // That's okay, continue anyway
        result.resolve(); 
      });
    return result.promise;
  }
}
      
export var instance = new Keys();