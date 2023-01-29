import WebSocket from 'ws';
import Output from './output';

export default class WebSocketOutput extends Output {
  #websocket;

  #host;

  #port;

  constructor (id, events, host, port) {
    super(id, events);
    this.#host = host;
    this.#port = port;
  }

  connect () {
    return new Promise((resolve, reject) => {
      this.#websocket = new WebSocket(`ws://${this.#host}:${this.#port}/ws`);

      this.#websocket.on('open', () => {
        this.#websocket.onclose = () => this.onDisconnect();
        resolve();
      });

      this.#websocket.onerror = () => {
        reject(new Error(`Unable to establish connection to host ${this._host} on port ${this._port}.`));
      };
    });
  }

  disconnect () {
    if (this.#websocket) {
      this.#websocket.close();
      this.#websocket = null;
    }
  }

  write (data) {
    this.#websocket.send(data);
  }
}
