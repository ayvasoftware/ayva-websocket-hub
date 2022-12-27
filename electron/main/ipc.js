import { ipcMain } from 'electron';
import { SerialPort } from 'serialport';

export default {
  init () {
    /* Handle Inter-Process Communication */
    ipcMain.handle('list-serial', async () => SerialPort.list());
  },
};
