"use strict";

var debug = require('debug')('hookup:register');

/**
 * @type {Object.<string, Socket>} peers    Map with all registered peers by their id
 */
let peers = {};


function add(connection, id) {
  debug('add', id);

  let previousId = findPeerBySocket(connection);
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

  peers[id] = connection;

  return id;
}

function remove(connection) {
  let id = findPeerBySocket(connection);
  debug('remove', id);

  if (id !== undefined) {
    delete peers[id];
  }
}

function findPeerBySocket(connection) {
  return Object.keys(peers).find(id => peers[id] === connection);
}

function find (id) {
  return peers[id];
}

exports.add = add;
exports.remove = remove;
exports.find = find;
