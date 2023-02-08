export default class Output {
  #id;

  #events;

  #disposed;

  connected;

  enabled;

  get id () {
    return this.#id;
  }

  constructor (id, events) {
    this.#id = id;
    this.#events = events;
    this.enabled = true;
  }

  poll () {
    if (this.#disposed) {
      return;
    }

    this.connect().then(() => {
      this.connected = true;
      this.#events.send('output-connected', this.id);
    }).catch(() => {
      setTimeout(() => this.poll(), 1000);
    });
  }

  onDisconnect () {
    this.connected = false;
    this.#events.send('output-disconnected', this.id);

    this.poll();
  }

  connect () {
    throw new Error('Output does not implement connect().');
  }

  disconnect () {
    throw new Error('Output does not implement disconnect()');
  }

  write (data) { // eslint-disable-line no-unused-vars
    throw new Error('Output does not implement write()');
  }

  dispose () {
    if (this.connected) {
      this.disconnect();
    }

    this.#disposed = true;
  }
}
