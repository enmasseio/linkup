'use strict';

var http = require('http');
var url = require('url');
var WebSocketServer = require('ws').Server;
var express = require('express');
var register = require('./src/register');
var requestify = require('./shared/requestify');

var PORT = 3000;
var app = express();
var server = require('http').createServer();
var wss = new WebSocketServer({ server: server });
var debug = require('debug')('hookup:server');
var debugSocket = require('debug')('hookup:socket');

// server static folders
app.use(express.static(`${__dirname}/client`, {index: ['index.html']}));
app.use(express.static(`${__dirname}/shared`));
app.use(express.static(`${__dirname}/node_modules/simple-peer`));
app.use(express.static(`${__dirname}/node_modules/reconnectingwebsocket`));


wss.on('connection', function connection(socket) {
  var location = url.parse(socket.upgradeReq.url, true);
  // you might use location.query.access_token to authenticate or share sessions
  // or ws.upgradeReq.headers.cookie (see http://stackoverflow.com/a/16395220/151312)

  debugSocket('A peer connected');

  // requestify the WebSocket
  var connection = requestify({
    send: function (message) {
      debugSocket('send message', message);
      socket.send(message)
    }
  });
  socket.on('message', function (message) {
    debugSocket('receive message', message);
    connection.receive(message);
  });

  socket.on('error', function (err) {
    debugSocket('Error', err);
  });

  socket.on('close', function () {
    debugSocket('A peer disconnected');

    register.remove(socket);
  });

  // handle incoming requests
  connection.on('request', function (message) {
    var fn = functions[message.type];
    if (!fn) {
      throw new Error(`Unknown message type "${message.type}"`);
    }
    return fn(connection, message);
  });

});


var functions = {
  /**
   * Register an id for a peer
   * @param {WebSocket} socket
   * @param {{type: 'register', id: string}} message
   * @return {string} Returns the peers id
   */
  register: function (socket, message) {
    return register.add(socket, message.id);
  },

  /**
   * Unregister this peer
   * @param {WebSocket} socket
   * @param {{type: 'register'}} message
   */
  unregister: function (socket, message) {
    register.remove(socket);
  },

  /**
   * Forward an offer to connect to a peer, should respond with an answer
   * @param {WebSocket} socket
   * @param {{type: 'connect', from: string, to: string, offer: string}} message
   * @return {Promise.<{answer: string}, Error>}
   */
  connect: function (socket, message) {
    let peer = register.find(message.to);
    if (!peer) {
      throw new Error(`Peer not found (id: ${message.to}})`);
    }
    return peer.request(message);
  }
};


server.on('request', app);
server.listen(PORT, function() {
  console.info(`Listening on port ${PORT}`);
});
