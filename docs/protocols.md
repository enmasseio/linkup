# Protocols

linkup uses JSON based protocols to communicate between brokers and peer.


## Messaging between broker and peer

Peers communicate with the broker server to register them with an id and to do
signalling with an other peer. Broker and peers send stringify JSON-RPC 2.0 messages
over the WebSocket connection.

A peer can send the following messages via a WebSocket to the broker:

Request                          | Response
-------------------------------- | ---------------------------------------------
`{"id": "UUID", "method": "ping", "params": {}}`              | `{"id": "UUID", "result": "pong", "error": null}`
`{"id": "UUID", "method": "find", "params": {"id": "peer-id"}}` | `{"id": "UUID", "result": "peer-id" | null, "error": null}`
`{"id": "UUID", "method": "register", {"id": "peer-id"}}`     | `{"id": "UUID", "result": "peer-id", "error": null} | {"id": "UUID", "result": null, "error": {...}}`
`{"id": "UUID", "method": "unregister", "params": {}}`        | `{"id": "UUID", "result": null, "error": null}`
`{"method": "signal", "params": {"from": "peer-id", "to": "peer-id", "signal": {...}}}` | No response, request is a notification

A broker can send the following messages to a peer:

Request                          | Response
-------------------------------- | ---------------------------------------------
`{method: 'signal', params: {from: 'peer-id', to: 'peer-id', signal: Object}}` | No response, request is a notification

## Messaging between broker servers (cluster)

Broker servers can run in a cluster, sending messages to each other via Redis pub/sub. The following messages can be send:

Message | Description
------- | -----------
`{"type":"signal","data":{"from": "peer-id", "to": "peer-id", "signal": {...}}}` | Forward a WebRTC signal
`{"type":"find","data":{"id": "peer-id"}}` | Ask the other servers whether they know a peer with id `"peer-id"`.
`{"type":"found","data":{"id": "peer-id"}}` | Response of a server that knows a peer with id `"peer-id"`.

