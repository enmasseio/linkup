import Emitter from 'emitter-component';

export class Connection {

  /**
   * Wrapper for a SimplePeer connection
   * @param {string} id
   * @param {SimplePeer} peer
   */
  constructor (id, peer) {
    this.id = id;     // the id of the other peer
    this.peer = peer; // SimplePeer object

    // pipe events from the peer
    this.peer.on('connect', () => this.emit('connect'));
    this.peer.on('close', () => this.emit('close'));
    this.peer.on('error', (err) => this.emit('error', err));
    this.peer.on('data',  (message) => this.emit('message', JSON.parse(message)));

    // turn into an event emitter
    Emitter(this);
  }

  /**
   * Resolves when the WebRTC connection is established
   * @return {Promise.<undefined, Error>}
   * @private
   */
  _waitUntilReady () {
    if (this.peer.connected) {
      return Promise.resolve();
    }
    else if (this.peer.destroyed) {
      return Promise.reject(new Error('WebRTC connection is destroyed'));
    }
    else {
      return new Promise((resolve, reject) => {
        this.peer.once('connect', resolve);
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
          this.peer.send(JSON.stringify(message))
        });
  }

  close () {
    return new Promise((resolve, reject) => {
      return this.peer.destroy(resolve);
    });
  }
}
