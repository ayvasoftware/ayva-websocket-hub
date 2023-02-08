import udp from 'dgram';
import Output from './output';

export default class UdpOutput extends Output {
  #socket;

  #host;

  #port;

  constructor (id, events, host, port) {
    super(id, events);
    this.#host = host;
    this.#port = port;
  }

  connect () {
    this.#socket = udp.createSocket('udp4');

    return Promise.resolve();
  }

  disconnect () {
    if (this.#socket) {
      this.#socket.close();
      this.#socket = null;
    }
  }

  write (data) {
    this.#socket.send(data, this.#port, this.#host);
  }
}
