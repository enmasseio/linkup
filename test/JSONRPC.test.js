"use strict";

var assert = require('assert');

import { JSONRPC } from '../src/shared/JSONRPC';

describe('JSONRPC', function () {

  it('should send a request - resolve sync', function () {
    var rpc1 = JSONRPC({
      send: (message) => rpc2.receive(message)
    });

    rpc1.on('greeting', function (params) {
      return 'hello ' + params.name;
    });

    var rpc2 = JSONRPC({
      send: (message) => rpc1.receive(message)
    });

    return rpc2.request('greeting', {name: 'joe'})
        .then(function (result) {
          assert.equal(result, 'hello joe');
        })
        .catch(function (err) {
          console.error(err);
          assert.fail('should not reject');
        })
  });

  it('should send a request - reject sync', function () {
    var rpc1 = JSONRPC({
      send: (message) => rpc2.receive(message)
    });

    rpc1.on('greeting', function (params) {
      throw new Error('no good!');
    });

    var rpc2 = JSONRPC({
      send: (message) => rpc1.receive(message)
    });

    return rpc2.request('greeting', {})
        .then(function (result) {
          console.log(result);
          assert.fail('Should not resolve');
        })
        .catch(function (err) {
          assert.equal(err.message, 'no good!');
        })
  });

  it('should send a request - resolve async', function () {
    var rpc1 = JSONRPC({
      send: (message) => rpc2.receive(message)
    });

    rpc1.on('greeting', function (params) {
      return new Promise(function (resolve, reject) {
        setTimeout(() => resolve('hello ' + params.name), 10);
      });
    });

    var rpc2 = JSONRPC({
      send: (message) => rpc1.receive(message)
    });

    return rpc2.request('greeting', {name: 'joe'})
        .then(function (result) {
          assert.equal(result, 'hello joe');
        })
        .catch(function (err) {
          console.error(err);
          assert.fail('Should not reject');
        })
  });

  it('should send a request - throw async', function () {
    var rpc1 = JSONRPC({
      send: (message) => rpc2.receive(message)
    });

    rpc1.on('greeting', function (params) {
      return new Promise(function (resolve, reject) {
        setTimeout(() => reject(new Error('whoops')), 10);
      });
    });

    var rpc2 = JSONRPC({
      send: (message) => rpc1.receive(message)
    });

    return rpc2.request('greeting', {name: 'joe'})
        .then(function (result) {
          console.log(result);
          assert.fail('Should not resolve');
        })
        .catch(function (err) {
          assert.equal(err.message, 'whoops');
        });
  });

  it('throw error in case of unknown method', function () {
    var rpc1 = JSONRPC({
      send: (message) => rpc2.receive(message)
    });

    var rpc2 = JSONRPC({
      send: (message) => rpc1.receive(message)
    });

    return rpc2.request('nonExistingFn', {})
        .then(function (result) {
          console.log(result);
          assert.fail('Should not resolve');
        })
        .catch(function (err) {
          assert.equal(err.message, 'Method not found');
          assert.equal(err.code, -32601);
          assert.deepEqual(err.data, {method: 'nonExistingFn'});
        });
  });

  // TODO: test notify

});
