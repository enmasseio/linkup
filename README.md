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

## Documentation

- [Examples](https://github.com/enmasseio/linkup/blob/master/examples/)
- [API](https://github.com/enmasseio/linkup/blob/docs/api.md)
- [Protocols](https://github.com/enmasseio/linkup/blob/docs/protocols.md)


## Similar libraries

- http://peerjs.com/
- https://webtorrent.io/
- https://github.com/js-platform/p2p
- https://github.com/InstantWebP2P/iwebpp.io
- https://github.com/cjb/serverless-webrtc



## Develop

First install the dependencies once:

```bash
$ npm install
```

To build & run the broker server in development mode with debugging:

```bash
$ npm start
```

Then open the following url in your browser:

http://localhost:5000

Note that the server must be restarted by hand on changes in the code.

The following environment variables can be provided:

Name           | Description
-------------- | -----------
PORT           | Port number for the server.
REDISCLOUD_URL | Optional redis database url, used for pub/sub messaging between multiple broker servers in a cluster.

Example usage:

```bash
$ PORT=5001 npm start
```


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

Then force Heroku to install all devDependencies, as it has to built the server application on startup:

```bash
$ heroku config:set NPM_CONFIG_PRODUCTION=false
```

In order to make the broker server scalable, multiple broker servers can be be set up in a cluster. The servers communicate via pub/sub messaging powered by Redis. This is optional.

To add a (free) Redis database to the Heroku setup:

```bash
$ heroku addons:create rediscloud
```

To deploy:

```bash
$ npm run deploy
```


## Roadmap

- Support for Android and iOS.
- Support for letting peers authenticate each other for example with
  a Google or Facebook id.
- Support authentication against the broker server, allowing to set up
  a private broker server.


## License

MIT
