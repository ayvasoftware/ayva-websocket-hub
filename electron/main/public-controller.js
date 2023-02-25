import { SerialPort } from 'serialport';
import { WebSocketServer } from 'ws';
import _ from 'lodash';
import WebSocketOutput from './lib/websocket-output';
import UdpOutput from './lib/udp-output';
import SerialOutput from './lib/serial-output';

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

  #closedSocketOnPurpose = null; // Way to distinguish intentional disconnects vs abrupt disconnects.

  constructor () {
    this.events = null;
  }

  /**
   * @returns List of objects containing method and handler names for all methods on this class.
   */
  getPublicApi () {
    return Object.getOwnPropertyNames(PublicController.prototype)
      .filter((method) => method !== 'constructor' && !method.startsWith('_')).map((method) => ({
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
   * @param {Boolean} enabled
   */
  addOutput (type, id, details, enabled = true) {
    let output;

    if (type === 'websocket') {
      output = new WebSocketOutput(id, this.events, details.host, details.port);
    } else if (type === 'udp') {
      output = new UdpOutput(id, this.events, details.host, details.port);
    } else if (type === 'serial') {
      output = new SerialOutput(id, this.events, details.path);
    }

    if (output) {
      output.enabled = enabled;
      this.#outputs.push(output);
      output.poll();
    }
  }

  /**
   * Delete the output with the specified id.
   *
   * @param {String|Nuber} id
   */
  deleteOutput (id) {
    const index = this.#outputs.findIndex((o) => o.id === id);

    if (index !== -1) {
      const [deletedOutput] = this.#outputs.splice(index, 1);

      deletedOutput.dispose(); // Prevent future polling.
    }
  }

  /**
   * @param {String|Number} id
   * @param {Boolean} enabled
   */
  toggleOutputEnabled (id, enabled) {
    const output = this.#outputs.find((o) => o.id === id);

    if (output) {
      output.enabled = enabled;
    }
  }

  /**
   * Start the WebSocket server on the specified port. Any existing server will be stopped.
   *
   * @param {Number} port
   */
  startServer (port) {
    this.stopServer();

    return new Promise((resolve, reject) => {
      const server = new WebSocketServer({ port, path: '/ws' });

      server.on('error', (error) => {
        reject(error);
      });

      server.on('listening', () => {
        resolve();
      });

      server.on('connection', (websocket) => {
        this.events.send('connected');

        websocket.on('message', (data) => {
          const forward = Buffer.from(data);

          this.events.send('message', forward.toString());
          for (const output of this.#outputs) {
            if (output.connected && output.enabled) {
              output.write(forward.toString());
            }
          }
        });

        websocket.on('close', () => {
          this.#websocket = null;
          this.events.send('disconnected');

          if (!this.#closedSocketOnPurpose) {
            this.events.send('restart-server');
          }

          this.#closedSocketOnPurpose = null;
        });

        this.#websocket = websocket;
      });

      this.#server = server;
    });
  }

  /**
   * <3
   */
  stopServer () {
    if (this.#server) {
      if (this.#websocket) {
        this.#closedSocketOnPurpose = true;
        this.#websocket.close();
      }

      this.#server.close();
      this.#server = null;
    }
  }
}
