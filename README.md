# linkup

Set up WebRTC connections between peers using nothing but an id.

Features:

- Simple way to set up peer-to-peer connections using WebRTC by giving
  peers an id.
- Provides a broker server for you, so you don't need to set up a
  server. You can run your own broker server too if you want.
- Open system. Like with the internet, each peer can connect to each other
  peer, and it's up to the peer to accept or deny connections. This is unlike
  most messaging platforms where you get an application key and peers can only
  talk to other peers within the same application (closed system).
- Works in browsers and node.js.

Roadmap:

- Support for Android and iOS.
- Support for letting peers authenticate each other for example with
  a Google or Facebook id.
- When setting up a WebRTC connection fails, fall back to a TURN server?


## Requirements

WebRTC relies on STUN and TURN servers for setting up connections between peers (via the ICE protocol). A STUN server is used to get an external network address, this is cheap and there are many STUN servers freely available. TURN servers are used to relay traffic if direct (peer to peer) connection fails. Since a TURN server passes all data the peers via the server, it requires a lot of bandwidth. Therefore TURN servers are not free.

By default, `linkup` is configured to use the free STUN/TURN service from [Viagénie](http://numb.viagenie.ca/), which is great for development and will get you going without having to set something up. For production use you will have to use (and pay for) your own STUN/TURN server or service.


## Install

Install the library via npm:

```bash
$ npm install linkup
```


## Use

### Browser

Here a simple example on how to use the library in the browser.
More examples are available in the [examples folder](./examples).

```html
<!DOCTYPE html>
<html>
<head>
  <!-- load the linkup client library -->
  <script src="dist/linkup.js"></script>

  <script>
    // create a peer with some id
    var peer = linkup.createPeer('peer1');

    // listen for messages from other peers
    peer.on('message', function (envelope) {
      console.log('Received message from', envelope.from, ':', envelope.message);
    });

    // we want to know when something goes wrong
    peer.on('error', function (err) {
      console.error(err);
    });

    // send a message to a peer
    peer.send('peer2', 'hi peer2!')
        .catch(function (err) {
          console.error(err);
        });
  </script>
</head>
</html>
```

### node.js

Before the library can be used in node.js the `wrtc` library has to be installed:

```bash
$ npm install wrtc
```

Then, `linkup` can be loaded like:

```js
var linkup = require('linkup');

// create a peer with some id
var peer = linkup.createPeer('peer1');

// listen for messages from other peers
peer.on('message', function (envelope) {
  console.log('Received message from', envelope.from, ':', envelope.message);
});

// we want to know when something goes wrong
peer.on('error', function (err) {
  console.error(err);
});

// send a message to a peer
peer.send('peer2', 'hi peer2!')
    .catch(function (err) {
      console.error(err);
    });
```


## Similar libraries

- http://peerjs.com/
- https://webtorrent.io/
- https://github.com/js-platform/p2p
- https://github.com/InstantWebP2P/iwebpp.io
- https://github.com/cjb/serverless-webrtc


## API

### linkup

#### Functions

##### linkup.createPeer(id [, options])

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

### Peer

A peer is constructed via the function `linkup.createPeer(id [, options])`.

#### Methods

##### Peer.connect(peerId)

Open a WebRTC connection to a peer.

- `@param {string} peerId`
- `@return {Promise.<Connection, Error>}` Resolves with a connection. When already connected with this peer, the existing connection is returned

##### Peer.disconnect(peerId)

Disconnect from a peer

- `@param {string} peerId`
- `@return {Promise.<undefined, Error>}` resolves when disconnected

##### Peer.send(peerId, message)

Send a message to a peer.
Will automatically establish a WebRTC connection if not yet connected.

- `@param {string} peerId`
- `@param {*} message`
- `@return {Promise<undefined, Error>}`

##### Peer.close()

Close a peer. Closes the connection to the broker server, and closes all open
WebRTC connections to peers.

- `@return Promise<undefined, Error>` Returns a promise which resolves when the message has been
  delivered.

#### Events

##### Peer.on('connection', function (connection) { })

Emitted when a new connection is created by a remote peer. The connection (type `Connection`) is passed as argument to the callback function.

##### Peer.on('error', function (error) { })

Emitted when an error occurs. The callback function is invoked with the error as argument.

##### Peer.on('message', function (envelope) { })

Emitted when a message is received. The passed `envelope` is an object containing the id of the sender as property `from`, and a property `message` containing the actual message:

```
Peer.on('message', function (envelope) {
  console.log('Received message from peer', envelope.from, ':', envelope.message);
});
```

##### Peer.on('register', function (id) { })

Emitted when the peer has registered it's id at the broker server. The callback function is invoked with the registered id as argument.

#### Properties

- `{string} Peer.id` The id of the peer


### Connection

Holds a WebRTC connection to an other peer. A connection is created via the method `Peer.connect(peerId)`.

#### Methods

##### `Connection.send(message)`

- `@param {*} message`  The message to be send. Must be a valid JSON object.
- `@return {Promise.<undefined, Error>}` Resolves when the message has been send

##### `Connection.close()`

Close the connection.

- `@return {Promise.<undefined, Error>}` Resolves when the connection has been closed.

#### Events

##### Connection.on('connect', function () { })

Emitted when connected.

##### Connection.on('close', function () { })

Emitted when the connection has been closed (normally by the remote peer).

##### Connection.on('error', function (error) { })

Emitted when an error occurs. The callback function is invoked with the error as argument.

##### Connection.on('message', function (message) { })

Emitted when a message is received. The callback function is invoked with the received message as argument.

#### Properties

- `{string} Connection.id` The id of the remote peer.

### Broker server protocol

Peers communicate with the broker server to register them with an id and to do
signalling with an other peer. The messages are stringified JSON.

A peer can send the following messages via a WebSocket to the broker:

Request                          | Response
-------------------------------- | ---------------------------------------------
`{id: UUID, message: {type: 'ping'}}`                 | `{id: UUID, message: 'pong', error: null}`
`{id: UUID, message: {type: 'find', id: 'peer-id'}}`  | `{id: UUID, message: 'peer-id' | null, error: null}`
`{id: UUID, message: {type: 'register', id: 'peer-id'}}` | `{id: UUID, message: 'peer-id', error: null} | {id: UUID, message: null, error: Error}`
`{message: {type: 'signal', from: 'peer-id', to: 'peer-id', signal: string}}` | No response, request is a notification

A broker can send the following messages to a peer:

Request                          | Response
-------------------------------- | ---------------------------------------------
`{message: {type: 'signal', from: 'peer-id', to: 'peer-id', signal: string}}` | No response, request is a notification



## Develop

First install the dependencies once:

```bash
$ npm install
```

To run the broker server in development mode with debugging:

```bash
$ npm start
```

Then open the following url in your browser:

http://localhost:5000

Note that the server must be restarted by hand on changes in the code.


## Build

The build script generates a bundled file for both peer libraries and for running the broker server.

```bash
$ npm install
$ npm run build
```

To run the generated the generated code for the broker server:

```bash
$ node dist/broker/server
```

### Deploy

To deploy to heroku, first set a git remote to your heroku application:

```bash
$ heroku git:remote -a my-heroku-app
```

Then force heroku to install all devDependencies, as it has to built the server application on startup:

```bash
$ heroku config:set NPM_CONFIG_PRODUCTION=false
```

To deploy:

```bash
$ npm run deploy
```


## License

MIT
