import Emitter from 'emitter-component';
import { find } from './register';
import { JSONRPC } from '../shared/JSONRPC';

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
    this.redisSubscriber.on('error', (err) => debug('Error', err));
    this.redisSubscriber.subscribe(REDIS_CHANNEL);
    this.redisSubscriber.on('message', (channel, message) => this._receive(message));

    // create a publisher client
    this.redisPublisher = redis.createClient(url);
    this.redisPublisher.on('error', (err) => debug('Error', err));
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
   * @return {Promise.<boolean, Error>} Resolves with `true` if any of the servers
   *                                    knows this peer, else resolves with `false`
   */
  exists (id) {
    return this._getSubscriberCount()
        .catch(err => {
          debug('Error', err);

          return Infinity; // this will simply wait until the timeout before concluding that a peer is not found
        })
        .then(count => {
          return new Promise((resolve, reject) => {
            let responses = 0;  // number of responses

            let callback = (response) => {
              if (response.id !== id) {
                return;
              }

              responses++;
              if (response.found || responses === count) {
                // a server responded with found=true, or all servers have responded
                this.off('found', callback);
                resolve(response.found);
              }
            };

            // cancel listening after a timeout
            setTimeout(() => this.off('found', callback), TIMEOUT);

            // listen for found responses
            this.on('found', callback);

            // ask all servers whether they know this peer
            this._send('find', {id});
          });
        });
  }

  /**
   * Publish a message via Redis. The message is send as stingified json
   * structured as {type: string, data: *}`
   * @param {string} type
   * @param {*} data
   * @private
   */
  _send (type, data) {
    let message = {type, data};
    debug('send message', message);

    this.redisPublisher.publish(REDIS_CHANNEL, JSON.stringify(message));
  }

  /**
   * Receive a stringified message
   * @param {string} message   Message is structured as
   * @private
   */
  _receive (message) {
    debug('receive message', message);
    let json = JSON.parse(message);

    if (json.type === 'signal') {
      this.emit('signal', json.data);
    }

    if (json.type === 'find') {
      this.emit('find', json.data);

      // send a response
      let id = json.data.id;
      let socket = find(id);
      this._send('found', {id, found: socket ? true : false});
    }

    if (json.type === 'found') {
      this.emit('found', json.data)
    }
  }

  /**
   * Retrieve the number of subscribers on our REDIS_CHANNEL from redis
   * @return {Promise.<number, Error>}
   * @private
   */
  _getSubscriberCount () {
    return new Promise((resolve, reject) => {
      this.redisPublisher.send_command('pubsub', ['numsub', REDIS_CHANNEL], (err, result) => {
        if (err) {
          reject(err);
        }
        else {
          // result is an Array like ['linkup', 123]
          let count = result[1];
          resolve(count);
        }
      });
    });
  }
}
