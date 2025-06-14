import Output from './output';

export default class WebBLEOutput extends Output {
  #deviceName;

  #connectPromiseResolve;

  constructor (id, events, deviceName) {
    super(id, events);
    this.#deviceName = deviceName;
  }

  connect () {
    return new Promise((resolve) => {
      this.#connectPromiseResolve = resolve;
    });
  }

  disconnect () {
    this.getEvents().send('web-ble-disconnect', this.#deviceName);
    this.#connectPromiseResolve = null;
  }

  write (data) {
    this.getEvents().send('web-ble-write', this.#deviceName, data);
  }

  onWebBLEConnected (deviceName) {
    if (deviceName === this.#deviceName && this.#connectPromiseResolve) {
      this.#connectPromiseResolve();
      this.#connectPromiseResolve = null;
    }
  }

  onWebBLEDisconnected (deviceName) {
    if (deviceName === this.#deviceName) {
      this.onDisconnect();
    }
  }
}
