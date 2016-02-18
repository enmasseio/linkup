"use strict";

var url = 'ws://' + location.host;

var socket = new ReconnectingWebSocket(url);

var qs = document.querySelector.bind(document);

var myId = null;

socket.onopen = function () {
  // TODO: restore registered peer id
  if (myId) {
    register(myId);
  }

  console.log('Connection opened');
};
socket.onclose = function () {
  console.log('Connection closed');
};
socket.onerror = function () {
  console.error('Error');
};


var connection = requestify();
connection.send = function (message) {
  console.log('send message', message);
  socket.send(message);
};
socket.onmessage = function (event) {
  console.log('receive message', event.data);
  connection.receive(event.data);
};

// handle an incoming request
connection.on('request', function (message) {
  var fn = functions[message.type];
  if (!fn) {
    throw new Error(`Unknown message type "${message.type}"`);
  }
  return fn(message);
});


var functions = {
  /**
   * Incoming connection request. The request contains an WebRTC offer, response will
   * contain an answer.
   * @param {{type: 'connect', from: string, to: string, offer: string}} message
   * @return {Promise.<{answer: string}, Error>}
   */
  connect: function onconnect(message) {
    console.log('onconnect', message);

    return new Promise(function (resolve, reject) {
      var peer = new SimplePeer({ initiator: false });
      window.peer = peer; // TODO: remove

      peer.on('error', function (err) {
        // TODO: reject promise?
        console.error(err);
      });

      peer.on('signal', function (data) {
        console.log('signal', data);

        if (data.type === 'answer') {
          resolve(data);
        }
      });

      peer.on('connect', function () {
        console.log('CONNECT');
        peer.send('hello from non-initiator')
      });

      peer.on('data', function (data) {
        console.log('data: ' + data)
      });


      peer.signal(message.offer);

    });
  }
};


function register (id) {
  return connection.request({type: 'register', id: id})
      .then(function (response) {
        console.log('response', response);
      })
      .catch(function (err) {
        console.error(err);
      });
}

function connect (from, to) {
  return new Promise(function (resolve, reject) {
    var peer = new SimplePeer({ initiator: true, trickle: false });
    window.peer = peer; // TODO: remove

    peer.on('error', function (err) {
      // TODO: reject promise?
      console.error(err);
    });

    peer.on('signal', function (data) {
      console.log('signal', JSON.stringify(data));

      if (data.type === 'offer') {
        return connection.request({type: 'connect', from, to, offer: data})
            .then(function (answer) {
              console.log('ANSWER', answer);
              peer.signal(answer)
            })
            .catch(function (err) {
              console.error(err);
            });
      }
    });

    peer.on('connect', function () {
      console.log('connect');
      peer.send('hello from initiator')
    });

    peer.on('data', function (data) {
      console.log('data: ' + data)
    });

  });

}

window.addEventListener('load', function load() {
  qs('#register').onclick = function () {
    myId = qs('#from').value;
    register(myId);
  };

  qs('#connect').onclick = function () {
    var from = qs('#from').value;
    var to = qs('#to').value;
    connect(from, to);
  };
});
