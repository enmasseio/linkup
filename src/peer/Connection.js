import Emitter from 'emitter-component';
import { universalDebug } from './universal/universalDebug';
import { UniversalSimplePeer } from './universal/UniversalSimplePeer';

let debug = universalDebug('linkup:connection');

export class Connection {

  /**
   * Wrapper for a SimplePeer connection.
   * The wrapper will stringify and parse sent/received messages,
   * and waits with sending a message until the peer is ready.
   * @param {string} id        Id of the remote peer
   * @param {Options} options  options for SimplePeer
   */
  constructor (id, options) {
    this.id = id;

    // create a SimplePeer (WebRTC connection)
    this._simplePeer = new UniversalSimplePeer(options);

    // pipe events from the WebRTC connection
    this._simplePeer.on('connect', () => this.emit('connect'));
    this._simplePeer.on('close', () => this.emit('close'));
    this._simplePeer.on('error', (err) => this.emit('error', err));
    this._simplePeer.on('data',  (message) => this.emit('message', JSON.parse(message)));
    this._simplePeer.on('signal', (message) => this.emit('signal', message));

    // turn into an event emitter
    Emitter(this);
  }

  /**
   * Resolves when the WebRTC connection is established
   * @return {Promise.<undefined, Error>}
   * @private
   */
  _waitUntilReady () {
    if (this._simplePeer.connected) {
      return Promise.resolve();
    }
    else if (this._simplePeer.destroyed) {
      return Promise.reject(new Error('WebRTC connection is destroyed'));
    }
    else {
      return new Promise((resolve, reject) => {
        this._simplePeer.once('connect', resolve);
      });
    }
  }

  /**
   * Send a message
   * @param message
   */
  send (message) {
    return this._waitUntilReady()
        .then(() => {
          this._simplePeer.send(JSON.stringify(message))
        });
  }

  /**
   * Deliver a signal to the SimplePeer
   * @param {Object} data
   */
  signal (data) {
    this._simplePeer.signal(data);
  }

  close () {
    return new Promise((resolve, reject) => {
      return this._simplePeer.destroy(resolve);
    });
  }
}
