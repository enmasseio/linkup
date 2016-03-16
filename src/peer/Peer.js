"use strict";

import Emitter from 'emitter-component';
import extend from 'extend';

import { universalDebug } from './universal/universalDebug';
import { Broker } from './Broker';
import { Connection } from './Connection';

let debug = universalDebug('linkup:peer');

export default class Peer {
  /**
   * Create a Peer.
   * @param {string} id
   * @param {{brokerUrl: string} | {brokerUrl: string, simplePeer: Object}} options
   */
  constructor (id, options) {
    this.isPeer = true; // type information

    // turn this Peer into an event emitter
    Emitter(this);

    /**
     * @type {string} the peers own id
     */
    this.id = id;
    this.options = options;
    this._registered = false;

    /**
     * @type {Object.<string, Connection>}
     */
    this._connections = {}; // connections to peers

    /**
     * create a broker
     * @type {Broker}
     */
    this._broker = new Broker(options.brokerUrl);
    this._broker.on('open', () => this._register());
    this._broker.on('signal', (message) => this._handleSignal(message));
    this._broker.on('error', (err) => this.emit('error', err));
  }

  /**
   * Register the peer with it's id at the broker
   * @private
   */
  _register () {
    this._registered = false;

    this._broker.register(this.id)
        .then((id) => {
          debug(`Registered at broker with id ${JSON.stringify(id)}`);
          this._registered = true;
          this.emit('register', id);
        })
        .catch((err) => this.emit('error', err));
  }

  /**
   * Wait until the peer has registered it's id at the broker
   * @return {Promise.<string, Error>} Resolves with the registered id
   * @private
   */
  _waitUntilRegistered () {
    if (this._registered) {
      return Promise.resolve(this.id);
    }
    else {
      return new Promise((resolve, reject) => {
        this.once('register', resolve);
      });
    }
  }

  /**
   * Connect to a peer.
   * When already connected with this peer, the existing connection is returned
   * @param {string} peerId
   * @return {Promise.<Connection, Error>} Resolves with a connection
   */
  connect (peerId) {
    let connection = this._connections[peerId];
    if (this.id === peerId) {
      return Promise.reject(new Error('Cannot connect to yourself dude'));
    }

    if (connection) {
      return Promise.resolve(connection);
    }

    // create a new connection
    return this._waitUntilRegistered()
        .then(() => this._broker.exists(peerId))
        .then((exists) => {
          if (!exists) {
            throw new Error(`Peer not found (id: "${peerId}")`);
          }

          return this._createConnection(peerId, {initiator: true});
        })
  }

  /**
   * Handle in incoming signal. Creates a new connection if it does not yet
   * exists, then deliver the signal.
   * @param {{from: string, to: string, signal: string}} params
   * @private
   */
  _handleSignal (params) {
    debug('handleSignal', params);

    let id = params.from;
    let connection = this._connections[id];
    if (!connection) {
      // create a new WebRTC connection if this is the first signal
      // for a new peer connection
      connection = this._createConnection(id, {initiator: false});
    }

    // deliver the signal
    connection.signal(params.signal);
  }

  /**
   * Create a new WebRTC connection
   * @param {string} id,
   * @param {Object} [options]
   * @return {Connection}
   * @private
   */
  _createConnection (id, options) {
    debug('create connection', id, options);

    let _options = extend({}, this.options.simplePeer || {}, options);
    let connection = new Connection(id, _options);

    // list the new connection
    this._connections[id] = connection;

    connection.on('connect', () => {
      debug('connected with peer ', id);
    });

    connection.on('close', () => {
      debug('disconnected from peer ', id);
      delete this._connections[id];

      this.emit('close', connection);
    });

    // TODO: should we verify the from field in the signal and messages?
    connection.on('signal', (signal) => this._broker.signal({
      from: this.id,
      to: id,
      signal
    }));

    connection.on('message', (message) => {
      debug('received message from', id, ':', message);
      this.emit('message', { from: id, message });
    });

    connection.on('error', (err) => this.emit('error', err));

    this.emit('connection', connection);

    return connection;
  }

  /**
   * Disconnect from a peer
   * @param {string} peerId
   * @return {Promise.<undefined, Error>} resolves when disconnected
   */
  disconnect (peerId) {
    debug('disconnect from peer ', peerId);

    let connection = this._connections[peerId];
    if (connection) {
      delete this._connections[peerId];

      return connection.close();
    }
    else {
      return Promise.resolve();
    }
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
    return this.connect(peerId)
        .then((connection) => connection.send(message))
        .then(() => debug('message sent'));
  }

  /**
   * Close all WebRTC connections and close the connection to the broker
   * @return {Promise}
   */
  close () {
    this._broker.close();
    this._broker = null;

    let closeConnections = Object.keys(this._connections)
        .map(peerId => this.disconnect(peerId));

    return Promise.all(closeConnections);
  }

}
