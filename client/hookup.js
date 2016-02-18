"use strict";

var peers = {};

var url = 'ws://' + location.host;

var socket = new ReconnectingWebSocket(url);

var qs = document.querySelector.bind(document);

socket.onopen = function () {
  console.log('Connection opened');
};
socket.onclose = function () {
  console.log('Connection closed');
};
socket.onerror = function () {
  console.error('Error');
};


var connection = requestify();
connection.send = function (message) {
  console.log('send message', message);
  socket.send(message);
};
socket.onmessage = function (event) {
  console.log('receive message', event.data);
  connection.receive(event.data);
};

// handle an incoming request
connection.on('request', function (message) {
  var fn = functions[message.type];
  if (!fn) {
    throw new Error(`Unknown message type "${message.type}"`);
  }
  return fn(message);
});


var functions = {
  /**
   * Incoming connection request. The request contains an WebRTC offer, response will
   * contain an answer.
   * @param {{type: 'connect', from: string, to: string, offer: string}} message
   * @return {Promise.<{answer: string}, Error>}
   */
  connect: function (message) {
    console.log('connect', message);

    // TODO: generate a real WebRTC answer
    return Promise.resolve({answer: 'answer...'});
  }
};


function register () {
  var id = qs('#from').value;

  connection.request({type: 'register', id: id})
      .then(function (response) {
        console.log('response', response);
      })
      .catch(function (err) {
        console.error(err);
      });
}

function connect () {
  var from = qs('#from').value;
  var to = qs('#to').value;
  var offer = 'offer...'; // TODO: generate a real WebRTC offer

  connection.request({type: 'connect', from, to, offer})
      .then(function (response) {
        console.log('response', response);
      })
      .catch(function (err) {
        console.error(err);
      });
}

window.addEventListener('load', function load() {
  qs('#register').onclick = register;
  qs('#connect').onclick = connect;
});


//
//function connectToPeer (peerId) {
//  var peer = new SimplePeer({ initiator: true, trickle: false });
//  peers[peerId] = peer;
//
//  peer.on('error', function (err) { console.log('error', err) });
//
//  peer.on('signal', function (data) {
//    console.log('SIGNAL', JSON.stringify(data));
//
//
//
//    document.querySelector('#outgoing').textContent = JSON.stringify(data)
//  });
//
//  document.querySelector('form').addEventListener('submit', function (ev) {
//    ev.preventDefault();
//    p.signal(JSON.parse(document.querySelector('#incoming').value))
//  });
//
//  peer.on('connect', function () {
//    console.log('CONNECT');
//    p.send('hello there ' + Math.random())
//  });
//
//  p.on('data', function (data) {
//    console.log('data: ' + data)
//  });
//
//}
//
//
//window.addEventListener('load', function () {
//
//  var p = new SimplePeer({ initiator: location.hash === '#1', trickle: false });
//
//  p.on('error', function (err) { console.log('error', err) });
//
//  p.on('signal', function (data) {
//    console.log('SIGNAL', JSON.stringify(data));
//    document.querySelector('#outgoing').textContent = JSON.stringify(data)
//  });
//
//  document.querySelector('form').addEventListener('submit', function (ev) {
//    ev.preventDefault();
//    p.signal(JSON.parse(document.querySelector('#incoming').value))
//  });
//
//  p.on('connect', function () {
//    console.log('CONNECT');
//    p.send('hello there ' + Math.random())
//  });
//
//  p.on('data', function (data) {
//    console.log('data: ' + data)
//  });
//  console.log('done')
//
//});