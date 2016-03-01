'use strict';

const hookup = require('../src/peer/hookup');

const peerId = 'peer2';

let peer = hookup.createPeer(peerId);

peer.on('register', () => {
  console.info('Registered as', peerId);
});
peer.on('error', err => {
  console.error(err);
});
peer.on('message', (envelope) => {
  console.log('Received message from', envelope.from, ':', envelope.message);
});


let to = 'peer1';
let message = 'hi there from node.js';
console.log('Sending message to', to, ':', message);

peer.send(to, message)
    .then(function () {
      console.log('Message sent');
    })
    .catch(function (err) {
      console.error(err);
    });