# Protocols

linkup uses JSON based protocols to communicate between brokers and peer.


## Messaging between broker and peer

Peers communicate with the broker server to register them with an id and to do
signalling with an other peer. Broker and peers send stringify JSON-RPC 2.0 messages
over the WebSocket connection.

### Peer to Broker

A peer can send the following messages via a WebSocket to the broker:

#### ping

Request:

```json
{"id": "UUID", "method": "ping", "params": {}}
```

Response:

```json
{"id": "UUID", "result": "pong", "error": null}
```

#### exists

Test whether a peer with some id exists or not.

Request:

```json
{"id": "UUID", "method": "exists", "params": {"id": "PEER_ID"}}
```

Response:

```json
{"id": "UUID", "result": true | false, "error": null}
```

#### register

Request:

```json
{"id": "UUID", "method": "register", {"id": "PEER_ID"}}
```

Response:

```json
{"id": "UUID", "result": "PEER_ID", "error": null}
```

or:

```json
{"id": "UUID", "result": null, "error": {...}}
```

#### unregister

Request:

```json
{"id": "UUID", "method": "unregister", "params": {}}
```

Response:

```json
{"id": "UUID", "result": null, "error": null}
```

#### signal

Pass a signal to another peer

Notification:

```json
{"method": "signal", "params": {"from": "PEER_ID", "to": "PEER_ID", "signal": {...}}}
```

No response, message is send as a notification (no property `id` in the JSON-RPC request).

### Broker to peer

A broker can send the following messages to a peer.

#### signal

Pass a signal received from some peer to another peer.

Notification:

```json
{"method": "signal", "params": {"from": "PEER_ID", "to": "PEER_ID", "signal": {...}}}
```

No response, message is send as a notification (no property `id` in the JSON-RPC request).


## Messaging between broker servers (cluster)

Broker servers can run in a cluster, sending messages to each other via Redis pub/sub. The following messages can be send.


#### signal

Pass a signal received from a peer to another broker server, which in turn deliver it to the addressed peer.

Message:

```json
{"type":"signal","data":{"from": "PEER_ID", "to": "PEER_ID", "signal": {...}}}
```

#### find

Ask another broker whether it has registered a peer with a certain id. All broker servers will respond by sending a `found` message with a value true or false.

Message:

```json
{"type":"find","data":{"id": "PEER_ID"}}
```

#### found

This message is send as reply on a `find` message.

Message:

```json
{"type":"found","data":{"id": "PEER_ID", "found": true | false}}
```
