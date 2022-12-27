import { contextBridge, ipcRenderer } from 'electron';

export default {
  init () {
    contextBridge.exposeInMainWorld('api', {
      /* Inter-Process Communication */
      async listSerial () {
        return ipcRenderer.invoke('list-serial');
      },
    });
  },
};
