"use strict";

var TIMEOUT = 60000; // ms
// TODO: make timeout a configuration setting

/**
 * Extend a messaging channel like a WebSocket with a request/response handling
 * layer. Requests are wrapped in an envelope with id and data, and responses
 * are packed in an envelope with this same id and response data.
 *
 * Usage:
 *
 *     var mySocket = new WebSocket('ws://localhost:3000');
 *
 *     // connect send and receive function of the WebSocket (or other transport)
 *     var rpc = requestify({
 *       send: function (message) {
 *         mySocket.send(message);
 *       }
 *     });
 *     mySocket.on('message', rpc.receive);
 *
 *     // to handle an incoming request
 *     rpc.on('request', function (message) {
 *       return 'some response';
 *     });
 *
 *     // to send a request
 *     rpc.request(message)
 *         .then(function (response) {
 *           console.log('response', response);
 *         })
 *         .catch(function (err) {
 *           console.error(err;
 *         });
 *
 * @param {{send: function (message)}} params
 * @return {{request: function, notify: function, send: function, receive: function}} RPC object
 */
export function requestify (params) {
  return (function () {
    var queue = {};   // queue with requests in progress

    var rpc = {
      send: params && params.send || function () {
        throw new Error('Cannot send messages, no send function defined. Define as rpc.send = function (message) {...}')
      }
    };

    /**
     * Promisify the requestListener, and catch errors thrown by requestListener
     * @param {Object} message
     * @return {Promise}
     */
    var onRequest = function (message) {
      try {
        var response = requestListener(message);
        if (isPromise(response)) {
          return response;
        }
        else {
          return Promise.resolve(response);
        }
      }
      catch (err) {
        return Promise.reject (err);
      }
    };

    var requestListener = function () {
      throw new Error('Cannot handle incoming request, no request listener. ' +
          'Register with rpc.on(\'request\', function (message) {return ...})');
    };

    /**
     * Register an event handler.
     * @param {string} event   Available events: 'request'
     * @param {function} callback
     */
    rpc.on = function (event, callback) {
      if (event === 'request') {
        requestListener = callback;
      }
      else {
        throw new Error('Unknown event "' + event + '"');
      }
    };

    /**
     * Event handler, handles incoming messages
     * @param {string} data
     */
    rpc.receive = function (data) {
      if (data.charAt(0) == '{') {
        var envelope = JSON.parse(data);

        // match the request from the id in the response
        var request = queue[envelope.id];
        if (request) {
          // handle an incoming response
          clearTimeout(request.timeout);
          delete queue[envelope.id];

          // resolve the promise with response data
          if (envelope.error) {
            // TODO: implement a smarter way to serialize and deserialize errors
            request.reject(new Error(envelope.error));
          }
          else {
            request.resolve(envelope.message);
          }
        }
        else {
          if ('id' in envelope) {
            // handle an incoming request
            onRequest(envelope.message)
                .then(function (message) {
                  var response = {
                    id: envelope.id,
                    message: message,
                    error: null
                  };
                  rpc.send(JSON.stringify(response));
                })
                .catch(function (error) {
                  var response = {
                    id: envelope.id,
                    message: null,
                    error: error.message || error.toString()
                  };
                  rpc.send(JSON.stringify(response));
                });
          }
          else {
            // handle incoming notification (we don't do anything with the response)
            onRequest(envelope.message);
          }
        }
      }
    };

    /**
     * Send a request
     * @param {*} message
     * @returns {Promise.<*, Error>} Returns a promise resolving with the response message
     */
    rpc.request = function (message) {
      return new Promise(function (resolve, reject) {
        // put the data in an envelope with id
        var id = uuid();
        var envelope = {
          id: id,
          message: message
        };

        // add the request to the list with requests in progress
        queue[id] = {
          resolve: resolve,
          reject: reject,
          timeout: setTimeout(function () {
            delete queue[id];
            reject(new Error('Timeout'));
          }, TIMEOUT)
        };

        rpc.send(JSON.stringify(envelope));
      });
    };

    /**
     * Send a notification. A notification does not receive a response.
     * @param {*} message
     * @returns {Promise.<null, Error>} Returns a promise resolving with the null
     *                                  when the notification has been sent.
     */
    rpc.notify = function (message) {
      return new Promise(function (resolve, reject) {
        // put the data in an envelope
        var envelope = {
          // we don't add an id, so we send this as notification instead of a request
          message: message
        };

        rpc.send(JSON.stringify(envelope));

        resolve(null);
      });
    };

    return rpc;
  })();
}

/**
 * Generate a UUID
 * http://stackoverflow.com/questions/105034/create-guid-uuid-in-javascript
 * // TODO: use some official uuid library
 * @return {string}
 */
function uuid() {
  function s4() {
    return Math.floor((1 + Math.random()) * 0x10000)
        .toString(16)
        .substring(1);
  }
  return s4() + s4() + '-' + s4() + '-' + s4() + '-' +
      s4() + '-' + s4() + s4() + s4();
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
