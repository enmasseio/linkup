"use strict";

var debug = require('debug')('linkup:register');

/**
 * @type {Object.<string, WebSocket>} peers    Map with all registered peers by their id
 */
let peers = {};


export function register(socket, id) {
  debug('add', id);

  let previousId = findPeerBySocket(socket);
  if (previousId !== undefined) {
    if (previousId === id) {
      // same id, nothing to do
      return;
    }
    else {
      // remove previous id
      delete peers[previousId];
    }
  }

  if (peers[id] !== undefined) {
    throw new Error(`id "${id}" already taken`);
  }

  peers[id] = socket;

  return id;
}

export function unregister(socket) {
  let id = findPeerBySocket(socket);
  debug('remove', id);

  if (id !== undefined) {
    delete peers[id];
  }
}

function findPeerBySocket(socket) {
  return Object.keys(peers).find(id => peers[id] === socket);
}

export function find (id) {
  return peers[id];
}
