"use strict";

var debug = require('debug')('hookup:register');

/**
 * @type {Object.<string, Socket>} peers    Map with all registered peers by their id
 */
let peers = {};

function findPeerBySocket(socket) {
  return Object.keys(peers).find(id => peers[id] === socket);
}

function add(socket, id) {
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

function remove(socket) {
  let id = findPeerBySocket(socket);
  debug('remove', id);

  if (id !== undefined) {
    delete peers[id];
  }
}

function find (id) {
  return peers[id];
}

exports.add = add;
exports.remove = remove;
exports.find = find;
