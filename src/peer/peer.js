"use strict";

import { requestify } from '../shared/requestify';
import ReconnectingWebSocket from 'reconnectingwebsocket';
import SimplePeer from 'simple-peer/simplepeer.min';

export default class Peer {
  /**
   * Create a Peer.
   * @param {string} id
   * @param {string} brokerUrl
   */
  constructor(id, brokerUrl) {
    this.isPeer = true; // type information

    this.id = id;
    this.connections = {}; // connections to peers

    // functions available via the WebSocket
    this.functions = {
      connect: message => this._handleConnect(message)
    };

    this.broker = this._connectWithBroker(brokerUrl);
  }

  /**
   * Listen for events
   * @param {'connect' | 'message' | 'error'} event
   * @param callback
   */
  on (event, callback) {
    // TODO: implement event handlers
  }

  /**
   * Send a message to a peer.
   * Will automatically establish a WebRTC connection if not yet connected.
   * @param {string} peerId
   * @param {*} message
   * @return {Promise<null, Error>}
   */
  send (peerId, message) {
    // TODO: implement connect and send
  }

  close() {
    // TODO: implement close
  }

  /**
   * Open a WebSocket to the broker
   * @param {string} url
   * @return {{socket: WebSocket, connection: Object, url: string}} broker connection
   * @private
   */
  _connectWithBroker (url) {
    // open a WebSocket
    let socket = new ReconnectingWebSocket(url);
    socket.onopen = () => {
      console.log(`Connected to broker ${url}`);
      this._register(this.id);
    };
    socket.onclose = function () {
      console.log('Disconnected from broker');
    };
    socket.onerror = function () {
      // TODO: propagate errors
      console.error('Error');
    };

    // requestify the WebSocket
    let connection = requestify();
    connection.send = function (message) {
      console.log('send message', message);
      socket.send(message);
    };
    socket.onmessage = function (event) {
      console.log('receive message', event.data);
      connection.receive(event.data);
    };

    // handle an incoming request
    connection.on('request', (message) => {
      var fn = this.functions[message.type];
      if (!fn) {
        throw new Error(`Unknown message type "${message.type}"`);
      }
      return fn(message);
    });
    
    return {socket, connection, url}
  }

  /**
   * Register the id of this peer at the broker
   * @param {string} id
   * @return {Promise.<string, Error>}
   * @private
   */
  _register (id) {
    return this.broker.connection.request({type: 'register', id: id})
        .then(function (response) {
          console.log('response', response);
        })
        .catch(function (err) {
          console.error(err);
        });
  }

  /**
   * Connect to a peer
   * @param {string} id
   * @return {Promise}
   * @private
   */
  _connect (id) {
    return new Promise((resolve, reject) => {
      var peer = new SimplePeer({ initiator: true, trickle: false });
      this.connections[id] = peer;

      peer.on('error', function (err) {
        // TODO: reject promise?
        console.error(err);
      });

      peer.on('signal', (data) => {
        console.log('signal', JSON.stringify(data));

        if (data.type === 'offer') {
          let message = {
            type: 'connect',
            from: this.id,
            to: id,
            offer: data
          };

          return this.broker.connection.request(message)
              .then(function (answer) {
                console.log('ANSWER', answer);
                peer.signal(answer);

                // TODO: return Promise which resolves as soon as connected
              })
              .catch(function (err) {
                console.error(err);
              });
        }
      });

      peer.on('connect', function () {
        console.log('connect');
        peer.send('hello from initiator')
      });

      peer.on('data', function (data) {
        console.log('data: ' + data)
      });

    });
  }


  /**
   * Accept a connection to an other peer
   * @param {Object} message
   * @return {Promise}
   * @private
   */
  _handleConnect (message) {
    console.log('_handleConnect', message);

    return new Promise((resolve, reject) => {
      var peer = new SimplePeer({ initiator: false });
      this.connections[message.from] = (peer);

      peer.on('error', function (err) {
        // TODO: reject promise?
        console.error(err);
      });

      peer.on('signal', function (data) {
        console.log('signal', data);

        if (data.type === 'answer') {
          resolve(data);
        }
      });

      peer.on('connect', function () {
        console.log('CONNECT');
        peer.send('hello from non-initiator')
      });

      peer.on('data', function (data) {
        console.log('data: ' + data)
      });


      peer.signal(message.offer);

      // TODO: return promise which resolves when connected
    });
  }
}
