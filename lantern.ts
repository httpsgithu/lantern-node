/// <reference path="typedefs/node.d.ts" />

var https          = require('https'),
    keys           = require('./modules/keys'),
    controlChannel = require('./modules/controlchannel');

keys.init()
    .then(controlChannel.start)
    .done();

//
//pem.createCertificate({ days: 1, selfSigned: true, keyBitsize: 2048 })
//  .then(function(caKeys) {
//    console.log(typeof(caKeys.clientKey));
//    pem.createCSR({ days: 1, commonName: 'oxcart' })
//      .then(function(csrKeys) {
//        pem.createCertificate({
//          days: 1,
//          csr: csrKeys.csr,
//          serviceKey: caKeys.clientKey,
//          serviceCertificate: caKeys.certificate,
//          serial: 12345 })
//          .then(function(keys) {
//            https.createServer({ key: csrKeys.clientKey, cert: keys.certificate }, function(req, res) {
//              res.end("o hai!")
//            }).listen(8443);
//            console.log("Started server");
//          })
//      });
//  }).done(function(success) {
//    console.log("Success:", success);
//  }, function(error) {
//    console.log("Error:", error);
//  });