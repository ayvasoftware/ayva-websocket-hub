import { SerialPort } from 'serialport';
import { WebSocketServer } from 'ws';
import _ from 'lodash';
import WebSocketOutput from './lib/websocket-output';

/**
 * This is the Public Backend Controller. All methods on this class will be made available
 * for Inter-Process Communication on the frontend.
 *
 * Handle with care.
 */
export default class PublicController {
  #server;

  #websocket;

  #outputs = [];

  constructor () {
    this.events = null;
  }

  /**
   * @returns List of objects containing method and handler names for all methods on this class.
   */
  getPublicApi () {
    return Object.getOwnPropertyNames(PublicController.prototype)
      .filter((method) => method !== 'constructor').map((method) => ({
        method,
        handler: _.kebabCase(method),
      }));
  }

  /**
   * @returns List of all serial ports.
   */
  listSerial () {
    return SerialPort.list();
  }

  /**
   * Add a new output with the specified type, id, and details.
   *
   * @param {String} type
   * @param {String|Number} id
   * @param {Object} details
   */
  addOutput (type, id, details) {
    if (type === 'websocket') {
      const output = new WebSocketOutput(id, this.events, details.host, details.port);
      this.#outputs.push(output);
      output.poll();
    }
  }

  /**
   * Start the WebSocket server on the specified port. Any existing server will be stopped.
   *
   * @param {Number} port
   */
  startServer (port) {
    this.stopServer();

    const server = new WebSocketServer({ port, path: '/ws' });

    server.on('connection', (websocket) => {
      this.events.send('connected');

      websocket.on('message', (data) => {
        const forward = Buffer.from(data);

        this.events.send('message', forward.toString());
        for (const output of this.#outputs) {
          if (output.connected) {
            output.write(forward.toString());
          }
        }
      });

      websocket.on('close', () => {
        this.#websocket = null;
        this.events.send('disconnected');
      });

      this.#websocket = websocket;
    });

    this.#server = server;
  }

  stopServer () {
    if (this.#server) {
      if (this.#websocket) {
        this.#websocket.close();
      }

      this.#server.close();
      this.#server = null;
    }
  }
}
