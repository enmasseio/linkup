# hookup
Hook up with peers by id using a WebRTC connection


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
