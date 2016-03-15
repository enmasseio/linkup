import Emitter from 'emitter-component';

export class Connection {

  /**
   * Wrapper for a SimplePeer connection
   * @param {string} id
   * @param {SimplePeer} peer
   */
  constructor (id, peer) {
    this.id = id;     // the id of the other peer
    this._simplePeer = peer; // SimplePeer object

    // pipe events from the peer
    this._simplePeer.on('connect', () => this.emit('connect'));
    this._simplePeer.on('close', () => this.emit('close'));
    this._simplePeer.on('error', (err) => this.emit('error', err));
    this._simplePeer.on('data',  (message) => this.emit('message', JSON.parse(message)));

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

  close () {
    return new Promise((resolve, reject) => {
      return this._simplePeer.destroy(resolve);
    });
  }
}
