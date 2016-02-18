var express = require('express');
var broker = require('./../src/server/broker');

var PORT = 3000;
var app = broker.createServer(PORT);

// server static folders
app.use(express.static(`${__dirname}`, {index: ['index.html']}));
app.use(express.static(`${__dirname}/../src/shared`));
app.use(express.static(`${__dirname}/../src/client`));
app.use(express.static(`${__dirname}/../node_modules/simple-peer`));
app.use(express.static(`${__dirname}/../node_modules/reconnectingwebsocket`));
