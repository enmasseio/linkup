import Emitter from 'emitter-component';

import ReconnectingWebSocket from './ReconnectingWebSocket';
import { universalDebug } from './universal/universalDebug';
import { UniversalWebSocket } from './universal/UniversalWebSocket';
import { UniversalSimplePeer }  from './universal/UniversalSimplePeer';

import { JSONRPC } from '../shared/JSONRPC';
import { Connection } from './Connection';

let debug = universalDebug('linkup:broker');
let debugSocket = universalDebug('linkup:socket');

export class Broker {
  /**
   * Create a new Broker
   * @param {string} url
   */
  constructor (url) {
    // Turn the broker into an event emitter
    Emitter(this);

    // map with all active WebRTC connections (peers)
    this.peers = {};

    // open a WebSocket
    this.url = url;
    this.socket = new ReconnectingWebSocket(url, null, {
      WebSocket: UniversalWebSocket
    });
    this.pingTimer = null; // timer used to keep the WebSocket alive

    // Create a JSON-RPC layer over the WebSocket
    this.rpc = JSONRPC({
      send: (message) => {
        debugSocket('send message', message);
        this.socket.send(message);
      }
    });
    this.socket.onmessage = (event) => {
      debugSocket('receive message', event.data);
      this.rpc.receive(event.data);
    };

    this.socket.onopen = () => {
      debug(`Connected to broker ${url}`);

      // send a ping every 45 seconds to keep the socket alive
      // Heroku will close a WebSocket after 55 seconds of inactivity
      this.pingTimer = setInterval(() => {
        debug('Send ping to keep the WebSocket alive...');
        this.rpc.request('ping', {})
            .catch((err) => this.emit('error', err));
      }, 45000);

      this.emit('open');
    };

    this.socket.onclose = () => {
      clearInterval(this.pingTimer);

      this.emit('close');
      debug('Disconnected from broker');
    };

    this.socket.onerror = (err) => {
      debug('Error', err);
      this.emit('error', err);
    };

    // pass incoming signals
    this.rpc.on('signal', (message) => {
      this.emit('signal', message);
      return undefined;
    });
  }

  /**
   * Test whether some peer exists
   * @param id
   * @return {Promise.<boolean, Error>}
   */
  exists (id) {
    return this.rpc.request('find', {id}).then((peer) => peer != null);
  }

  /**
   * Register a peer by id
   * @param peerId
   * @return {Promise<string, Error>} Resolves with the registered peer id
   */
  register (peerId) {
    return this._waitUntilConnected()
        .then(() => this.rpc.request('register', {id: peerId}));
  }

  /**
   * Unregister
   * @return {Promise<null, Error>} Resolves when unregistered
   */
  unregister () {
    return this._waitUntilConnected()
        .then(() => this.rpc.request('unregister', {}));
  }

  /**
   * Send a signal to a peer
   * @param {{from: string, to: string, signal: Object}} message
   * @return {Promise<null, Error>} Resolves when the signal is sent
   */
  signal (message) {
    return this._waitUntilConnected()
        .then(() => this.rpc.notify('signal', message));
  }

  /**
   * Close the WebSocket connection to the signalling server.
   */
  close() {
    this.socket.close();
  }

  /**
   * Waits until the broker is ready: there is a socket connection with
   * the broker server.
   * @return {Promise.<undefined, Error>}
   * @private
   */
  _waitUntilConnected () {
    switch (this.socket.readyState) {
      case ReconnectingWebSocket.OPEN:
        return Promise.resolve();

      case ReconnectingWebSocket.CONNECTING:
        return new Promise ((resolve, reject) => {
          this.once('open', resolve);
        });

      case ReconnectingWebSocket.CLOSING:
        return Promise.reject(new Error('WebSocket is closed'));

      case ReconnectingWebSocket.CLOSED:
        return Promise.reject(new Error('WebSocket is closing'));

      default:
        return Promise.reject(new Error('WebSocket has an unknown readyState'));
    }
  }

}
