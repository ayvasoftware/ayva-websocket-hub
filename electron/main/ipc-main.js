import { ipcMain } from 'electron';
import PublicController from './public-controller';

const controller = new PublicController();

export default {
  init () {
    /* Handle Inter-Process Communication */
    controller.getPublicApi().forEach(({ method, handler }) => {
      ipcMain.handle(handler, (event, ...args) => controller[method](...args));
    });
  },
};
