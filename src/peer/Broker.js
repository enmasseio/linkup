import Emitter from 'emitter-component';
import extend from 'extend';

import ReconnectingWebSocket from './ReconnectingWebSocket';
import { universalDebug } from './universal/universalDebug';
import { UniversalWebSocket } from './universal/UniversalWebSocket';
import { UniversalSimplePeer }  from './universal/UniversalSimplePeer';

import { JSONRPC } from '../shared/JSONRPC';
import { Connection } from './Connection';

let debug = universalDebug('linkup:broker');
let debugSocket = universalDebug('linkup:socket');
let debugWebRTC = universalDebug('linkup:webrtc');

export default class Broker {
  /**
   * Create a new Broker
   * @param {string} url
   * @param {Object} [options]  Optional object with options for a SimplePeer
   *                            connection. The available options are described
   *                            in the SimplePeer docs:
   *                            https://github.com/feross/simple-peer#api
   */
  constructor (url, options) {
    // Turn the broker into an event emitter
    Emitter(this);

    this.options = options || {};

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

    // handle an incoming signals
    this.rpc.on('signal', (params) => this._handleSignal(params));
  }

  /**
   * Connect to a peer
   * @param {string} from
   * @param {string} to
   * @return {Promise.<Connection, Error>}
   */
  initiateConnection (from, to) {
    debug(`initiate connection from ${from} to ${to}`);

    return this.rpc.request('find', {id: to})
        .then((peer) => {
          if (!peer) {
            throw new Error(`Peer not found (${to})`);
          }
        })
        // if the peer exists, create a connection
        .then(() => {
          let peer = this.peers[to];
          if (!peer) {
            let initiator = true;
            peer = this._createSimplePeer(from, to, initiator);

            // list the new peer
            this.peers[to] = peer;
            peer.on('close', () => delete this.peers[to]);

            this.emit('connection', new Connection(to, peer));
          }

          return new Connection(to, peer);
        });
  }

  /**
   * Handle in incoming signal. Creates a new connection if it does not yet
   * exists, then deliver the signal.
   * @param {{from: string, to: string, signal: string}} params
   * @private
   */
  _handleSignal (params) {
    debug('handleSignal', params);

    let from = params.to;
    let to = params.from;
    let peer = this.peers[to];
    if (!peer) {
      // create a new WebRTC peer if this is the first signal for a new peer connection
      let initiator = false;
      peer = this._createSimplePeer(from, to, initiator);

      // list the new peer
      this.peers[to] = peer;
      peer.on('close', () => delete this.peers[to]);

      this.emit('connection', new Connection(to, peer));
    }

    // deliver the signal
    peer.signal(params.signal);
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

  // TODO: implement unregister

  /**
   * Close the WebSocket connection to the signalling server.
   */
  close() {
    this.socket.close();
  }

  /**
   * Create a new SimplePeer (a WebRTC connection)
   * @param {string} from
   * @param {string} to
   * @param {boolean} initiator
   * @return {SimplePeer}
   * @private
   */
  _createSimplePeer (from, to, initiator) {
    let options = extend({}, this.options, {initiator});
    let peer = new UniversalSimplePeer(options);

    peer.on('signal', (data) => {
      debugWebRTC('signal', data);

      this.rpc
          .notify('signal', {from, to, signal: data })
          .catch((err) => {this.emit('error', err)});
    });

    return peer;
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
