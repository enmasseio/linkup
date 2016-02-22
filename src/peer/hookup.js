import Peer from './Peer';

const BROKER_URL = 'ws://localhost:3000'; // TODO: change to online hosted broker

/**
 * Create a new Peer
 * @param {string} id
 * @param {string} [brokerUrl='ws://localhost:3000']
 * @return {Peer}
 */
export function createPeer (id, brokerUrl = BROKER_URL) {
  return new Peer(id, brokerUrl);
}
