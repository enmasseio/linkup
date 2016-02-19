


export class peer {
  constructor(id, brokerUrl = null) {
    this.id = id;

    this.brokerUrl = brokerUrl;
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

  }

  close() {
    // TODO: implement close
  }


}