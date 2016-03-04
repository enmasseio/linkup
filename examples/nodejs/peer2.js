// Start both peer1.js and peer2.js in a terminal like:
//
//    node examples/nodejs/peer1.js
//    node examples/nodejs/peer2.js

var linkup = require('../../dist/linkup');

// create peer2
var peer = linkup.createPeer('peer2');


// listen for messages from other peers
peer.on('message', function (envelope) {
  console.log('Received message from', envelope.from, ':', envelope.message);
});

// we want to know when something goes wrong
peer.on('error', function (err) {
  console.error(err);
});

// send a message to peer1 every second
setInterval(function () {
  peer.send('peer1', 'hello there! ' + new Date().getSeconds())
      .catch(function (err) {
        console.error(err);
      });
}, 2000);
