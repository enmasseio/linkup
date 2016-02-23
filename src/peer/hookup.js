import debug from 'debug/browser';
import Peer from './Peer';

const BROKER_URL = 'ws://hookitup.herokuapp.com';

/**
 * Create a new Peer
 * @param {string} id
 * @param {string} [brokerUrl='ws://localhost:3000']
 * @return {Peer}
 */
export function createPeer (id, brokerUrl = BROKER_URL) {
  return new Peer(id, brokerUrl);
}

// expose debugging object to the window
// To activate debugging:
//
//   hookupDebug.enable('hookup:*')
window.hookupDebug = debug;