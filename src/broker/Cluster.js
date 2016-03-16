import Emitter from 'emitter-component';
import { find } from './register';
import { JSONRPC } from '../shared/JSONRPC';
import * as emitOnce from '../shared/emitOnce';

let redis = require('redis');
let debug = require('debug')('linkup:redis');

const REDIS_CHANNEL = 'linkup';
const TIMEOUT = 10000; // timeout for redis messages

/**
 * Pub/sub for a cluster of servers, powered by redis
 * @param {string} url   Url of the redis database
 */
export class Cluster {

  constructor (url) {
    // Turn the broker into an event emitter
    Emitter(this);

    // create a subscriber client
    this.redisSubscriber = redis.createClient(url);

    // TODO: listen for errors etc on the publisher

    this.redisSubscriber.on('error', function (err) {
      debug('Error', err);
    });

    // create a publisher client
    this.redisPublisher = redis.createClient(url);
    this.redisPublisher.on('error', function (err) {
      debug('Error', err);
    });

    this.redisSubscriber.subscribe(REDIS_CHANNEL);
    this.redisSubscriber.on('message',  (channel, message) => this._receive(message));
  }

  _receive (message) {
    debug('receive message', message);
    let json = JSON.parse(message);

    if (json.type === 'signal') {
      this.emit('signal', json.data);
    }

    if (json.type === 'find') {
      let id = json.data.id;
      let socket = find(id);
      if (socket) {
        this._send('found', {id});
      }
    }

    if (json.type === 'found') {
      let id = json.data.id;
      emitOnce.emit(id, true);
    }
  }

  _send (type, data) {
    let message = {type, data};
    debug('send message', message);

    this.redisPublisher.publish(REDIS_CHANNEL, JSON.stringify(message));
  }

  /**
   * Send a signal to the other servers in the cluster
   * @param {{from: string, to: string, signal: Object}} params
   */
  signal (params) {
    this._send('signal', params);
  }

  /**
   * Ask all servers whether they know a certain peer
   * @param {string} id
   * @return {Promise}
   */
  exists (id) {
    this._send('find', {id});

    return emitOnce.once(id, TIMEOUT)
        .catch(err => false); // return false when a timeout occurs
  }
}
