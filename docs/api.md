# API

API documentation contains the following sections:

- [linkup](#linkup) The namespace returned when loading the library.
- [Peer](#peer) Instance of a peer. A peer can connect to multiple remote peers
  and send and receive messages.
- [Connection](#connection) A connection to a remote peer.


## linkup

### Functions

#### linkup.createPeer(id [, options])

Create a new peer

- `@param {string} id`  The id for the peer. Other peers will be able to connect
  to this peer using this id.
- `@param {Object} [options]` Optional options. The options are structured like:

  ```js
  var options = {
    browserUrl: 'wss://linkup-broker.herokuapp.com',
    simplePeer: {
      // SimplePeer options, for example `trickle: true`
    }
  }
  ```

  The options for SimplePeer (creating WebRTC connections) are described here:
  https://github.com/feross/simple-peer#api

- `@return Peer` Returns a peer instance



## Peer

A peer is constructed as:
 
```js
let peer = linkup.createPeer(id [, options])
```

### Methods

#### peer.connect(peerId)

Open a WebRTC connection to a peer.

- `@param {string} peerId`
- `@return {Promise.<Connection, Error>}` Resolves with a connection. When already connected with this peer, the existing connection is returned

#### peer.disconnect(peerId)

Disconnect from a peer

- `@param {string} peerId`
- `@return {Promise.<undefined, Error>}` resolves when disconnected

#### peer.send(peerId, message)

Send a message to a peer.
Will automatically establish a WebRTC connection if not yet connected.

- `@param {string} peerId`
- `@param {*} message`
- `@return {Promise<undefined, Error>}`

#### peer.close()

Close a peer. Closes the connection to the broker server, and closes all open
WebRTC connections to peers.

- `@return Promise<undefined, Error>` Returns a promise which resolves when the message has been
  delivered.

### Events

#### peer.on('connection', function (connection) { })

Emitted when a new connection is created by a remote peer. The peer id and
connection (type `Connection`) is passed as argument to the callback function.

#### peer.on('close', function (connection) { })

Emitted when a connection is closed. The peer id and connection
(type `Connection`) is passed as argument to the callback function.

#### peer.on('error', function (error) { })

Emitted when an error occurs. The callback function is invoked with the error as argument.

#### peer.on('message', function (envelope) { })

Emitted when a message is received. The passed `envelope` is an object containing the id of the sender as property `from`, and a property `message` containing the actual message:

```
peer.on('message', function (envelope) {
  console.log('Received message from peer', envelope.from, ':', envelope.message);
});
```

#### peer.on('register', function (id) { })

Emitted when the peer has registered it's id at the broker server. The callback function is invoked with the registered id as argument.

### Properties

#### peer.id

A string with the id of the peer.




## Connection

Holds a WebRTC connection to an other peer. A connection is created as:

```js
let connection = peer.connect(peerId)
```

### Methods

#### `connection.send(message)`

- `@param {*} message`  The message to be send. Must be a valid JSON object.
- `@return {Promise.<undefined, Error>}` Resolves when the message has been send

#### `connection.close()`

Close the connection.

- `@return {Promise.<undefined, Error>}` Resolves when the connection has been closed.

### Events

#### connection.on('connect', function () { })

Emitted when connected.

#### connection.on('close', function () { })

Emitted when the connection has been closed (normally by the remote peer).

#### connection.on('error', function (error) { })

Emitted when an error occurs. The callback function is invoked with the error as argument.

#### connection.on('message', function (message) { })

Emitted when a message is received. The callback function is invoked with the received message as argument.

#### connection.on('signal', function (signal) { })

Emitted when a WebRTC signal is received. The callback function is invoked with
the received signal as argument.

### Properties

#### connection.id

A string with the id of the remote peer.
