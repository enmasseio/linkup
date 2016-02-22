import Emitter from 'emitter-component';

export class Connection {
  /**
   * Wrapper for a SimplePeer connection
   * @param {string} id
   * @param {SimplePeer} peer
   * @param {Promise} ready
   */
  constructor (id, peer, ready) {
    this.id = id;  // the id of the other peer
    this.peer = peer;
    this.ready = ready;

    // pipe events from the peer
    this.peer.on('close', () => this.emit('close'));
    this.peer.on('error', (err) => this.emit('error', err));
    this.peer.on('data',  (message) => {
      this.emit('message', {from: this.id, message})
    });

    // turn into an event emitter
    Emitter(this);
  }

  close () {
    return new Promise((resolve, reject) => {
      return this.peer.destroy(resolve);
    });
  }
}
