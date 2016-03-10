import extend from 'extend';
import { universalDebug } from './universal/universalDebug';
import Peer from './Peer';

export const DEFAULT_BROKER_URL = 'wss://linkup-broker.herokuapp.com';

export const DEFAULT_SIMPLE_PEER_OPTIONS = {
  trickle: true,
  config: {
    iceServers: [
      {
        urls: ['stun:23.21.150.121' ] // default of simple-peer
      },
      {
        urls: [
          'stun:stun.l.google.com:19302',
          'stun:stun1.l.google.com:19302',
          'stun:stun2.l.google.com:19302',
          'stun:stun3.l.google.com:19302',
          'stun:stun4.l.google.com:19302'
        ]
      },
      // Free STUN/TURN service by Viagénie http://numb.viagenie.ca/
      {
        'url': 'stun:numb.viagenie.ca:3478'
      },
      {
        'url': 'turn:numb.viagenie.ca:3478',
        'username': 'jos@almende.org',
        'credential': 'dHywSjue6gLn'
      }
    ]
  }
};

/**
 * Create a new Peer
 * @param {string} id
 * @param {{brokerUrl: string} | {brokerUrl: string, simplePeer: Object}} [options]
 * @return {Peer}
 */
export function createPeer (id, options) {
  return new Peer(id, {
    brokerUrl: options && options.brokerUrl || DEFAULT_BROKER_URL,
    simplePeer: extend({}, DEFAULT_SIMPLE_PEER_OPTIONS, options && options.simplePeer || {})
  });
}

// expose our instance of debug to window, so we can enable/disable debugging
// output. To activate debugging:
//
//   linkupDebug.enable('linkup:*')
//
if (typeof window !== 'undefined') {
  window.linkupDebug = universalDebug;
}
