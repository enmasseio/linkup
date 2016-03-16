"use strict";

import {uuid} from './uuid';

/**
 * Extend a messaging channel like a WebSocket with a JSON-RPC 2.0 layer.
 *
 * Usage:
 *
 *     let mySocket = new WebSocket('ws://localhost:3000');
 *
 *     // connect send and receive function of the WebSocket (or other transport)
 *     let rpc = JSONRPC({
 *       send: function (data) {
 *         mySocket.send(data);
 *       }
 *     });
 *     mySocket.onmessage = function (event) {
 *       rpc.receive(event.data);
 *     }
 *
 *     // handle an incoming method calls
 *     rpc.on('myFunction', function (params) {
 *       return 'some response';
 *     });
 *
 *     // to send a request
 *     rpc.request(method, params)
 *         .then(function (result) {
 *           console.log('result', result);
 *         })
 *         .catch(function (error) {
 *           console.error(error);
 *         });
 *
 * @param {{send: function (data: string)}} params
 * @return {{request: function, notify: function, send: function, receive: function}} rpc peer object
 */
export function JSONRPC (params) {
  return (function () {
    let queue = {};   // queue with requests in progress

    if (!params || typeof params.send !== 'function') {
      throw new Error('Required property send missing or not a function')
    }

    let rpc = {
      TIMEOUT: 50000, // ms
      send: params.send,
      methods: {}
    };

    /**
     * Promisify the requestListener, and catch errors thrown by requestListener
     * @param {string} method
     * @param {Object} params
     * @return {Promise}
     */
    let onRequest = function (method, params) {
      try {
        let fn = rpc.methods[method];
        if (!fn) {
          let err = new Error(`Method not found ("${method}")`);
          err.code = -32601; // method not found
          err.data = { method };
          return Promise.reject(err);
        }

        let result = fn(params);
        if (isPromise(result)) {
          return result;
        }
        else {
          return Promise.resolve(result);
        }
      }
      catch (err) {
        return Promise.reject (err);
      }
    };

    /**
     * Register a function
     * @param {string} name   Function name
     * @param {function(params: Object)} fn
     */
    rpc.on = function (name, fn) {
      rpc.methods[name] = fn;
    };

    /**
     * Event handler, handles incoming messages
     * @param {string} data
     */
    rpc.receive = function (data) {
      if (data.charAt(0) != '{') {
        return;
      }

      let message = JSON.parse(data);

      // match the request from the id in the response
      let request = queue[message.id];
      if (request) {
        // handle an incoming response
        clearTimeout(request.timeout);
        delete queue[message.id];

        // resolve the promise with response data
        if (message.error) {
          // TODO: implement a smarter way to serialize and deserialize errors
          let err = new Error(message.error.message);
          err.code = message.error.code || null;
          err.data = message.error.data || null;
          request.reject(err);
        }
        else {
          request.resolve(message.result);
        }
      }
      else if ('method' in message) { // distinguish request from response
        if ('id' in message) {
          // handle an incoming request
          onRequest(message.method, message.params)
              .then(function (result) {
                let response = {
                  jsonrpc: '2.0',
                  id: message.id,
                  result,
                  error: null
                };
                rpc.send(JSON.stringify(response));
              })
              .catch(function (error) {
                let response = {
                  jsonrpc: '2.0',
                  id: message.id,
                  result: null,
                  error: {
                    code: error.code || -32603, // internal error
                    message: error.message || error.toString(),
                    data: error.data || null
                  }
                };
                rpc.send(JSON.stringify(response));
              });
        }
        else {
          // handle incoming notification (we don't do anything with the response)
          onRequest(message.method, message.params)
            .catch(function (err) {
              console.error(err);
            });
        }
      }
      else {
        // ignore. it's an invalid message or a response with wrong id or something
      }
    };

    /**
     * Send a request
     * @param {string} method
     * @param {Object} params
     * @returns {Promise.<*, Error>} Returns a promise resolving with the result
     */
    rpc.request = function (method, params) {
      return new Promise(function (resolve, reject) {
        let id = uuid();
        let request = { jsonrpc: '2.0', id, method, params };

        // add the request to the list with requests in progress
        queue[id] = {
          resolve: resolve,
          reject: reject,
          timeout: setTimeout(function () {
            delete queue[id];
            reject(new Error('Timeout'));
          }, rpc.TIMEOUT)
        };

        rpc.send(JSON.stringify(request));
      });
    };

    /**
     * Send a notification. A notification does not receive a response.
     * @param {string} method
     * @param {Object} params
     * @returns {Promise.<null, Error>} Returns a promise resolving with the null
     *                                  when the notification has been sent.
     */
    rpc.notify = function (method, params) {
      return new Promise(function (resolve, reject) {
        // we don't add an id, so we send this as notification instead of a request
        let notification = { jsonrpc: '2.0', method, params };

        rpc.send(JSON.stringify(notification));

        resolve(null);
      });
    };

    return rpc;
  })();
}

/**
 * Test whether some object is a Promise
 * @param {Object} object
 * @return {boolean}
 */
function isPromise (object) {
  return object
      && typeof object['then'] === 'function'
      && typeof object['catch'] === 'function';
}
