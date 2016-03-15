"use strict";

var assert = require('assert');

import { requestify } from '../src/shared/requestify';

describe('requestify', function () {

  it('should send a request - resolve sync', function () {
    var server = requestify({
      send: (message) => client.receive(message)
    });

    function handleRequest (message) {
      return 'hello ' + message.name;
    }
    server.on('request', handleRequest);

    var client = requestify({
      send: (message) => server.receive(message)
    });

   return client.request({name: 'client1'})
        .then(function (response) {
          assert.equal(response, 'hello client1');
        })
        .catch(function (err) {
          console.error(err);
          assert.fail('should not reject');
        })
  });

  it('should send a request - reject sync', function () {
    var server = requestify({
      send: (message) => client.receive(message)
    });

    function handleRequest (message) {
      throw new Error('no good!');
    }
    server.on('request', handleRequest);

    var client = requestify({
      send: (message) => server.receive(message)
    });

    return client.request({name: 'client1'})
        .then(function (response) {
          console.log(response);
          assert.fail('Should not resolve');
        })
        .catch(function (err) {
          assert.equal(err.message, 'no good!');
        })
  });

  it('should send a request - resolve async', function () {
    var server = requestify({
      send: (message) => client.receive(message)
    });

    function handleRequest (message) {
      return new Promise(function (resolve, reject) {
        setTimeout(() => resolve('hello ' + message.name), 10);
      });
    }
    server.on('request', handleRequest);

    var client = requestify({
      send: (message) => server.receive(message)
    });

    return client.request({name: 'client1'})
        .then(function (response) {
          assert.equal(response, 'hello client1');
        })
        .catch(function (err) {
          console.error(err);
          assert.fail('Should not reject');
        })
  });

  it('should send a request - throw async', function () {
    var server = requestify({
      send: (message) => client.receive(message)
    });

    function handleRequest (message) {
      return new Promise(function (resolve, reject) {
        setTimeout(() => reject(new Error('whoops')));
      });
    }
    server.on('request', handleRequest);

    var client = requestify({
      send: (message) => server.receive(message)
    });

    return client.request({name: 'client1'})
        .then(function (response) {
          console.log(response);
          assert.fail('Should not resolve');
        })
        .catch(function (err) {
          assert.equal(err.message, 'whoops');
        });
  });

  it('throw error when request handler is not defined', function () {
    var server = requestify({
      send: (message) => client.receive(message)
    });

    var client = requestify({
      send: (message) => server.receive(message)
    });

    return client.request({name: 'client1'})
        .then(function (response) {
          console.log(response);
          assert.fail('Should not resolve');
        })
        .catch(function (err) {
          assert.ok(err.message.startsWith('Cannot handle incoming request, no request listener'));
        });
  });

  // TODO: test notify

});
