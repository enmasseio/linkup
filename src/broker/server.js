'use strict';

// commonjs imports
let url = require('url');
let WebSocketServer = require('ws').Server;
let express = require('express');

// es6 imports
import { register, unregister, find } from './register';
import { JSONRPC } from '../shared/JSONRPC';


function createServer (port) {
  port = port || 3000;

  let debug = require('debug')('linkup:server');
  let debugSocket = require('debug')('linkup:socket');
  let app = express();
  let server = require('http').createServer();

  // serve static files from folder dist
  app.use(express.static('dist'));

  let wss = new WebSocketServer({ server: server });

  wss.on('connection', function connection(socket) {
    let location = url.parse(socket.upgradeReq.url, true);
    // you might use location.query.access_token to authenticate or share sessions
    // or ws.upgradeReq.headers.cookie (see http://stackoverflow.com/a/16395220/151312)

    debugSocket('A peer connected');

    let peerId = null; // id of the peer. Will be filled in when the peer registers

    // Create a JSON-RPC layer on top of the WebSocket
    let rpc = JSONRPC({
      send: function (message) {
        debugSocket('send message', message);
        socket.send(message)
      }
    });
    socket.rpc = rpc;
    socket.on('message', function (message) {
      debugSocket('receive message', message);
      rpc.receive(message);
    });

    socket.on('error', function (err) {
      debugSocket('Error', err);
    });

    socket.on('close', function () {
      debugSocket('A peer disconnected');

      unregister(socket);
    });

    // ping method used by the client to keep the WebSocket alive
    rpc.on('ping', function (params) {
      return 'pong';
    });

    // register a peers id
    rpc.on('register', function (params) {
      peerId = register(socket, params.id);
      return peerId;
    });

    // unregister a peers id
    rpc.on('unregister', function () {
      unregister(socket);
    });

    // find a peer, see if it exists
    rpc.on('find', function (params) {
      return find(params.id)
          ? {id: params.id}
          : null;
    });

    // pass a signal to another peer
    rpc.on('signal', function (params) {
      if (params.from !== peerId) {
        throw new Error(
            `Invalid id. params.from (${JSON.stringify(params.from)}) does not match the id of the the connection (${JSON.stringify(peerId)})`)
      }

      let toSocket = find(params.to);
      if (!toSocket) {
        throw new Error(`Peer not found (${params.to})`);
      }
      toSocket.rpc.notify('signal', params);
    });
  });

  server.on('request', app);
  server.listen(port, function() {
    console.info(`Listening on port ${port}`);
  });

  return app;
}

let PORT = process.env.PORT || 5000;
createServer(PORT);
