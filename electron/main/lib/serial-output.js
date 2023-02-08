import { SerialPort } from 'serialport';
import _ from 'lodash';
import Output from './output';

export default class SerialOutput extends Output {
  #path;

  #port;

  constructor (id, events, path) {
    super(id, events);
    this.#path = path;
  }

  connect () {
    return new Promise((resolve, reject) => {
      this.#port = new SerialPort({
        path: this.#path,
        baudRate: 115200,
      }, (error) => {
        reject(new Error(`Unable to open serial port: ${error}`));
      });

      const onDisconnect = _.debounce(this.onDisconnect.bind(this), 100);

      this.#port.on('open', () => {
        this.#port.on('close', () => {
          onDisconnect();
        });
        resolve();
      });

      this.#port.on('error', () => {});
    });
  }

  disconnect () {
    if (this.#port) {
      this.#port.close();
      this.#port = null;
    }
  }

  write (data) {
    this.#port.write(data);
  }
}
