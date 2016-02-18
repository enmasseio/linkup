# hookup
Hook up with peers by id using a WebRTC connection



## Develop

To run the server in development mode and with debugging:

```
babel-node src/server/broker
```

Then open the following file in your browser:

```
/demo/index.html
```


## Build

The build script generates a bundled file for both clients and for running the broker server.

```
npm install
npm run build
```

To run the generated code for the server:

```
node dist/broker
```


## License

MIT
