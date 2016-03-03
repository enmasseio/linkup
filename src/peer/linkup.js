import { universalDebug } from './universal/universalDebug';
import Peer from './Peer';

const BROKER_URL = 'wss://linkup-broker.herokuapp.com';

/**
 * Create a new Peer
 * @param {string} id
 * @param {string} [brokerUrl='wss://linkup-broker.herokuapp.com']
 * @return {Peer}
 */
export function createPeer (id, brokerUrl = BROKER_URL) {
  return new Peer(id, brokerUrl);
}

// expose our instance of debug to window, so we can enable/disable debugging
// output. To activate debugging:
//
//   linkupDebug.enable('linkup:*')
//
if (typeof window !== 'undefined') {
  window.linkupDebug = universalDebug;
}
