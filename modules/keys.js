/// <reference path='../typedefs/node.d.ts' />
var deferred = require('deferred'), _fs = require('fs'), fs = {
    readFile: deferred.promisify(_fs.readFile),
    writeFile: deferred.promisify(_fs.writeFile)
}, mkdirp = require('mkdirp'), _pem = require('pem'), pem = {
    createCertificate: deferred.promisify(_pem.createCertificate)
}, config = require('./config');

var Keys = (function () {
    function Keys(certificateAuthorities) {
        if (typeof certificateAuthorities === "undefined") { certificateAuthorities = []; }
        this.certificateAuthorities = certificateAuthorities;
        var keysDir = config.configDir + '/keys/';
        this._csrFile = keysDir + 'csr.csr';
        this._privateKeyFile = keysDir + 'privatekey.pem';
        this._certificateFile = keysDir + 'certificate.pem';

        try  {
            mkdirp.sync(keysDir);
        } catch (error) {
        }
    }
    Object.defineProperty(Keys.prototype, "csr", {
        get: function () {
            return this._csr;
        },
        enumerable: true,
        configurable: true
    });

    Object.defineProperty(Keys.prototype, "privateKey", {
        get: function () {
            return this._privateKey;
        },
        enumerable: true,
        configurable: true
    });

    Object.defineProperty(Keys.prototype, "certificate", {
        get: function () {
            return this._certificate;
        },
        enumerable: true,
        configurable: true
    });

    Keys.prototype.init = function () {
        console.log('Initializing keys');
        var self = this;
        var result = deferred();

        this.readKeyData().then(this.createKeyDataIfNecessary.bind(this)).done(function () {
            result.resolve();
        }, function (error) {
            console.log('Unable to create key data: ', error);
            result.reject(error);
        });

        return result.promise;
    };

    Keys.prototype.readKeyData = function () {
        var result = deferred();

        deferred.map([this._csrFile, this._privateKeyFile, this._certificateFile], function (filename) {
            return fs.readFile(filename, { encoding: 'utf8' });
        }).then(this.captureKeyData.bind(this)).done(function (data) {
            result.resolve(true);
        }, function (error) {
            result.resolve(false);
        });

        return result.promise;
    };

    Keys.prototype.captureKeyData = function (data) {
        console.log('Using key data from disk');
        this._csr = data[0];
        this._privateKey = data[1];
        this._certificate = data[2];
    };

    Keys.prototype.createKeyDataIfNecessary = function (keyDataFound) {
        if (!keyDataFound) {
            console.log('Key data not found on disk, creating ...');
            var shouldSelfSign = !config.sponsor;
            if (shouldSelfSign) {
                console.log('No sponsor, signing our own certificate');
            }
            return pem.createCertificate({ keyBitsize: 2048, selfSigned: shouldSelfSign }).then(this.saveCSR.bind(this)).then(this.savePrivateKey.bind(this)).then(this.saveCertificate.bind(this));
        }
    };

    Keys.prototype.saveCSR = function (certData) {
        this._csr = certData.csr;
        this._privateKey = certData.clientKey;
        this._certificate = certData.certificate;
        return fs.writeFile(this._csrFile, this._csr);
    };

    Keys.prototype.savePrivateKey = function () {
        return fs.writeFile(this._privateKeyFile, this._privateKey);
    };

    Keys.prototype.saveCertificate = function () {
        return fs.writeFile(this._certificateFile, this._certificate);
    };
    return Keys;
})();

module.exports = new Keys();
