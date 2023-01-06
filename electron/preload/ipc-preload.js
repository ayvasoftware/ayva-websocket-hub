import { contextBridge, ipcRenderer } from 'electron';

export default {
  init () {
    const api = {};

    /**
     * Fetch the Public API and expose it to the frontend.
     */
    ipcRenderer.invoke('get-public-api').then((publicApi) => {
      publicApi.forEach(({ method, handler }) => {
        api[method] = async function (...args) {
          return ipcRenderer.invoke(handler, ...args);
        };
      });

      contextBridge.exposeInMainWorld('api', api);
    });
  },
};
