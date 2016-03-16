
let listeners = {};

/**
 * Listen once for an event
 * @param {string} event
 * @param [timeout]  Timeout in milliseconds for cancelling the listener
 * @returns {Promise.<*, Error>} Resolves when the event triggers,
 *                               Rejects when a timeout occurs
 */
export function once(event, timeout) {
  return new Promise(function (resolve, reject) {
    let entry = { resolve, reject };

    if (!listeners[event]) {
      listeners[event] = [];
    }
    listeners[event].push(entry);

    // set a timeout
    if (timeout) {
      entry.timer = setTimeout(function () {
        cleanup(event, entry);
        reject(new Error('Timeout'));
      }, timeout);
    }
  });
}

/**
 * Emit an event. This will trigger all listeners once and remove them from the queue
 * @param {string} event
 * @param {*} [data]
 */
export function emit(event, data) {
  let entries = listeners[event];
  if (entries) {
    entries.forEach(function (entry) {
      cleanup(event, entry);
      entry.resolve(data);
    });
  }
}

/**
 * Remove an entry: cancel the timeout and remove from the listener queue
 * @param {string} event
 * @param {{timer: number}} entry
 */
function cleanup (event, entry) {
  clearTimeout(entry.timer);

  if (listeners[event]) {
    let index = listeners[event].indexOf(entry);
    if (index !== -1) {
      listeners[event].splice(index, 1);
    }
    if (listeners[event].length === 0) {
      delete listeners[event];
    }
  }
}
