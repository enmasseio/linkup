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


var channel = requestify();
channel.send = function (message) {
  console.log('send message', message);
  socket.send(message);
};
socket.onmessage = function (event) {
  console.log('receive message', event.data);
  channel.receive(event.data);
};

window.addEventListener('load', function load() {

  qs('#register').onclick = function () {
    var id = qs('#from').value;
    channel.request({type: 'register', id: id})
        .then(function (response) {
          console.log('response', response);
        })
        .catch(function (err) {
          console.error(err);
        });
  };

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