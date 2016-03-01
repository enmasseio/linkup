"use strict";

import Emitter from 'emitter-component';
import debugFactory from 'debug/browser';

import { requestify } from '../shared/requestify';
import { initiateConnection, acceptConnection } from './Connection';
import Broker from './Broker';

let debug = debugFactory('linkup:peer');

export default class Peer {
  /**
   * Create a Peer.
   * @param {string} id
   * @param {string} brokerUrl
   */
  constructor(id, brokerUrl) {
    this.isPeer = true; // type information

    // turn this Peer into an event emitter
    Emitter(this);

    /**
     * @type {string} the peers own id
     */
    this.id = id;

    /**
     * @type {Object.<string, {peer: SimplePeer, ready: Promise}>}
     */
    this.connections = {}; // connections to peers

    /**
     * create a broker
     * @type {Broker}
     */
    this.broker = new Broker(brokerUrl);
    this.broker.on('connection', (connection) => this._acceptConnection(connection));
    this.broker.on('open', () => this._register());
  }

  /**
   * Register the peer with it's id at the broker
   * @private
   */
  _register () {
    this.broker.ready
        .then(() => {
          return this.broker.connection.request({type: 'register', id: this.id})
        })
        .then((id) => {
          debug(`Registered at broker with id ${JSON.stringify(id)}`);
          this.emit('register');
        })
        .catch((err) => this.emit('error', err));
  }

  /**
   * Connect to a peer.
   * When already connected with this peer, the existing connection is returned
   * @param {string} peerId
   * @return {Promise.<null, Error>} resolves when connected
   */
  connect (peerId) {
    let connection = this.connections[peerId];
    if (!connection) {
      connection = this.broker.initiateConnection(this.id, peerId);

      connection.on('message', (message) => this.emit('message', message));
      connection.on('error', (err) => this.emit('error', err));
      connection.on('close', () => {
        debug('disconnected from peer ', peerId);
        delete this.connections[peerId];
      });

      this.connections[peerId] = connection;
    }

    return connection.ready;
  }

  /**
   * Accept an incoming connection
   * @param {{id: string, peer: SimplePeer, ready: Promise}} connection
   * @private
   */
  _acceptConnection (connection) {
    // add the new connection to the map with open connections
    let peerId = connection.id;
    this.connections[peerId] = connection;

    connection.on('message', (message) => {
      debug('received message from', peerId, ':', message);
      this.emit('message', JSON.parse(message));
    });
    connection.on('error', (err) => this.emit('error', err));
    connection.on('close', () => {
      debug('closed connection with ', peerId);
      delete this.connections[peerId];
    });
  }

  /**
   * Disconnect from a peer
   * @param {string} peerId
   * @return {Promise.<null, Error>} resolves when disconnected
   */
  disconnect (peerId) {
    debug('disconnect from peer ', peerId);

    return new Promise((resolve, reject) => {
      let connection = this.connections[peerId];
      if (connection) {
        delete this.connections[peerId];

        return connection.close();
      }
      else {
        return Promise.resolve();
      }
    });
  }

  /**
   * Send a message to a peer.
   * Will automatically establish a WebRTC connection if not yet connected.
   * @param {string} peerId
   * @param {*} message
   * @return {Promise<undefined, Error>}
   */
  send (peerId, message) {
    debug('sending message to', peerId, ':', message);
    return this.broker.ready
        .then(() => this.connect(peerId))
        .then(() => this.connections[peerId].peer.send(JSON.stringify(message)))
        .then(() => debug('message sent'))
  }

  /**
   * Close all WebRTC connections and close the connection to the broker
   * @return {Promise}
   */
  close() {
    this.broker.close();
    this.broker = null;

    let promises = Object.keys(this.connections).map(peerId => this.disconnect(peerId));

    return Promise.all(promises);
  }

}
