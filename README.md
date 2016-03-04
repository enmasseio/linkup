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

Roadmap:

- Support browsers, mobile browsers, node.js, Android, iOS.
- Support for letting peers authenticate each other for example with
  a Google or Facebook id.
- When setting up a WebRTC connection fails, fall back to a TURN server?


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


## Inspiration

- https://github.com/js-platform/p2p
- https://webtorrent.io/
- http://peerjs.com/


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
