import { SerialPort } from 'serialport';
import _ from 'lodash';

/**
 * This is the Public Backend Controller. All methods on this class will be made available
 * for Inter-Process Communication on the frontend.
 *
 * Handle with care.
 */
export default class PublicController {
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
}
