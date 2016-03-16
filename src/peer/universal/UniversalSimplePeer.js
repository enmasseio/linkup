import isNode from 'detect-node';
import SimplePeer from 'simple-peer/simplepeer.min';

export const UniversalSimplePeer = isNode
    ? NodeSimplePeer  // node.js
    : SimplePeer;     // browser


function NodeSimplePeer (options = {}) {
  let SimplePeer = require('simple-peer');
  let wrtc = require('wrtc');

  options.wrtc = wrtc;

  return new SimplePeer(options);
}