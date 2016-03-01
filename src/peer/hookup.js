import debug from 'debug/browser';
import Peer from './Peer';

const BROKER_URL = 'wss://hookitup.herokuapp.com';

/**
 * Create a new Peer
 * @param {string} id
 * @param {string} [brokerUrl='wss://hookitup.herokuapp.com']
 * @return {Peer}
 */
export function createPeer (id, brokerUrl = BROKER_URL) {
  return new Peer(id, brokerUrl);
}

// expose debugging object to the window
// To activate debugging:
//
//   hookupDebug.enable('hookup:*')
if (typeof window !== 'undefined') {
  window.hookupDebug = debug;
}
