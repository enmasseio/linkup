import isNode from 'detect-node';
import debugBrowser from 'debug/browser';

export const universalDebug = isNode
    ? require('debug')
    : debugBrowser;
