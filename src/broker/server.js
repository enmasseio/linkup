'use strict';

// commonjs imports
let url = require('url');
let WebSocketServer = require('ws').Server;
let express = require('express');

// es6 imports
import { Cluster } from './Cluster';
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

    // register an id for a peer
    rpc.on('register', function (params) {
      // FIXME: two peers can accidentally register at two servers with the same id
      return exists(params).then(doesExist => {
          if (doesExist) {
            throw new Error(`id "${params.id}" already taken`);
          }

          peerId = register(socket, params.id); // put peerId in global variable
          return peerId;
        });
    });

    // unregister a peers id
    rpc.on('unregister', function () {
      unregister(socket);
    });

    // find a peer, see if it exists
    rpc.on('exists', (params) => exists(params));

    // pass a signal to another peer
    rpc.on('signal', function (params) {
      if (params.from !== peerId) {
        throw new Error(
            `Invalid id. params.from (${JSON.stringify(params.from)}) does not match the id of the the connection (${JSON.stringify(peerId)})`)
      }

      let socket = find(params.to);
      if (socket) {
        socket.rpc.notify('signal', params);
      }
      else if (cluster) {
        cluster.signal(params);
      }
      else {
        throw new Error(`Peer not found (${params.to})`);
      }
    });
  });

  // redis is used to send messages between servers. It is optional
  let cluster = null;
  if (process.env.REDISCLOUD_URL) {
    debug('creating redis client...');
    cluster = new Cluster(process.env.REDISCLOUD_URL);

    // handle incoming test whether a peer exists
    cluster.on('exists', (params) => {
      let socket = find(params.to);
      return socket ? true : false;
    });

    // handle incoming signals
    cluster.on('signal', (params) => {
      let socket = find(params.to);
      if (socket) {
        socket.rpc.notify('signal', params);
      }
      else {
        // just ignore, we don't know this peer
      }
    })
  }
  else {
    debug('No environment variable REDISCLOUD_URL provided. Skipping support for multiple servers');
  }

  /**
   * Check whether a peer exists
   * @param {{id: string}} params
   * @return {*}
   */
  function exists(params) {
    let socket = find(params.id);
    if (socket) {
      return true;
    }

    if (cluster) {
      // ask other servers in the cluster whether they know this peer
      return cluster.exists(params.id);
    }

    return false;
  }

  server.on('request', app);
  server.listen(port, function() {
    console.info(`Listening on port ${port}`);
  });

  return app;
}

let PORT = process.env.PORT || 5000;
createServer(PORT);
