import Emitter from 'emitter-component';

import ReconnectingWebSocket from './ReconnectingWebSocket';
import { universalDebug } from './universal/universalDebug';
import { UniversalWebSocket } from './universal/UniversalWebSocket';
import { UniversalSimplePeer }  from './universal/UniversalSimplePeer';

import { requestify } from '../shared/requestify';
import { Connection } from './Connection';

let debug = universalDebug('linkup:broker');
let debugSocket = universalDebug('linkup:socket');
let debugWebRTC = universalDebug('linkup:webrtc');

const TRICKLE = true;

export default class Broker {
  /**
   * Create a new Broker
   * @param {string} url
   */
  constructor (url) {  // TODO: allow passing webrtc options like trickle
    // Turn the broker into an event emitter
    Emitter(this);

    // map with all active peers
    this.peerId = null; // our own id
    this.peers = {};

    // open a WebSocket
    this.url = url;
    this.socket = new ReconnectingWebSocket(url, null, {
      WebSocket: UniversalWebSocket
    });
    this.pingTimer = null; // timer used to keep the WebSocket alive

    // requestify the WebSocket
    this.connection = requestify();
    this.connection.send = (message) => {
      debugSocket('send message', message);
      this.socket.send(message);
    };

    this.socket.onmessage = (event) => {
      debugSocket('receive message', event.data);
      this.connection.receive(event.data);
    };

    this.socket.onopen = () => {
      debug(`Connected to broker ${url}`);

      // send a ping every 45 seconds to keep the socket alive
      // Heroku will close a WebSocket after 55 seconds of inactivity
      this.pingTimer = setInterval(() => {
        debug('Send ping to keep the WebSocket alive...');
        this.connection.request({type: 'ping'})
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

    // handle an incoming request
    this.functions = {
      signal: (message) => this._handleSignal(message)
    };
    this.connection.on('request', (message) => {
      let fn = this.functions[message.type];
      if (!fn) {
        throw new Error(`Unknown message type "${message.type}"`);
      }
      return fn(message);
    });
  }

  /**
   * Connect to a peer
   * @param {string} to
   * @return {Promise.<Connection, Error>}
   */
  initiateConnection (to) {
    debug(`initiate connection from ${this.peerId} to ${to}`);

    return this._waitUntilRegistered()
        // first check whether this peer exists
        .then((peerId) => {
          if (to === peerId) {
            throw new Error('Cannot connect to yourself dude');
          }

          return this.connection.request({type: 'find', id: to})
        })
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
            peer = this._createPeer(to, initiator);

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
   * @param message
   * @private
   */
  _handleSignal (message) {
    debug('handleSignal', message);

    let id = message.from;
    let peer = this.peers[id];
    if (!peer) {
      let initiator = false;
      peer = this._createPeer(id, initiator);

      // list the new peer
      this.peers[id] = peer;
      peer.on('close', () => delete this.peers[id]);

      this.emit('connection', new Connection(id, peer));
    }

    // deliver the signal
    peer.signal(message.signal);
  }

  /**
   * Register a peer by id
   * @param peerId
   */
  register (peerId) {
    return this._waitUntilConnected()
        .then(() => {
          return this.connection.request({type: 'register', id: peerId})
        })
        .then((peerId) => {
          this.peerId = peerId;
          this.emit('register', peerId);
          return peerId;
        });
  }

  // TODO: implement unregister

  /**
   * Close the WebSocket connection to the signalling server.
   */
  close() {
    this.socket.close();
  }

  /**
   * Create a new SimplePeer
   * @param {string} to
   * @param {boolean} initiator
   * @return {SimplePeer}
   * @private
   */
  _createPeer (to, initiator) {
    let peer = new UniversalSimplePeer({
      initiator,
      trickle: TRICKLE,
      config: { // TODO: make customizable
        //iceServers: [ { url: 'stun:23.21.150.121' } ] // default of simple-peer
        iceServers: [
          // https://gist.github.com/yetithefoot/7592580
          //{
          //  urls: ['stun:stun.services.mozilla.com']
          //},
          {
            urls: [
              'stun:stun.l.google.com:19302',
              'stun:stun1.l.google.com:19302',
              'stun:stun2.l.google.com:19302',
              'stun:stun3.l.google.com:19302',
              'stun:stun4.l.google.com:19302'
            ]
          }
        ]
      }
    });

    peer.on('signal', (data) => {
      debugWebRTC('signal', data);

      this._waitUntilRegistered()
          .then((from) => {
            return this.connection.request({ type: 'signal', from, to, signal: data })
          })
          .catch((err) => {
            console.log('error catching...', err)
            this.emit('error', err)
          });
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

  /**
   * Wait until the peer has registered it's id at the broker
   * @return {Promise.<string, Error>} Resolves with the registered id
   * @private
   */
  _waitUntilRegistered () {
    if (this.peerId) {
      return Promise.resolve(this.peerId);
    }
    else {
      return new Promise((resolve, reject) => {
        this.once('register', resolve);
      });
    }
  }

}
