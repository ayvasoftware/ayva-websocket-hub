export default class Output {
  #id;

  #events;

  connected;

  get id () {
    return this.#id;
  }

  constructor (id, events) {
    this.#id = id;
    this.#events = events;
  }

  poll () {
    console.log('Started polling.');

    return this.connect().then(() => {
      this.connected = true;
      console.log('Connected to output.');
      this.#events.send('output-connected', this.id);
    }).catch(() => {
      console.log(`Failed to connect to output ${this.#id}. Retrying.`);
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
}
