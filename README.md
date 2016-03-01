# linkup

Link up peers by id using a WebRTC connection

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


## Install

```bash
$ npm install linkup
```


## Use

### Browser

```html
<!DOCTYPE html>
<html>
<head>
  <!-- load the linkup client library -->
  <script src="dist/peer/linkup.js"></script>

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
    peer.send('peer2', 'hi peer2!');
  </script>
</head>
</html>
```


### Node.js

... node.js support coming soon...


## Inspiration

- https://github.com/js-platform/p2p
- https://webtorrent.io/
- http://peerjs.com/


## Develop

To run the broker server in development mode and with debugging:

```
npm run dev-server
```

To watch the code for changes and built the client side lib, open a second terminal and run:

```
npm run watch
```

Then open the following file in your browser:

```
/demo/index.html
```


## Build

The build script generates a bundled file for both peer libraries and for running the broker server.

```
npm install
npm run build
```

To run the generated the generated code for the broker server:

```
node dist/broker/server
```


## License

MIT
