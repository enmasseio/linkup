export const UniversalWebSocket = (typeof WebSocket !== 'undefined')
    ? WebSocket       // browser
    : require('ws');  // node.js
