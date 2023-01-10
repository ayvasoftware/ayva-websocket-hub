import { contextBridge, ipcRenderer } from 'electron';
import _ from 'lodash';
import publicEvents from './public-events';

export default {
  init () {
    const api = {};
    const apiEvents = {};

    /**
     * Fetch the Public API and expose it to the frontend.
     */
    ipcRenderer.invoke('get-public-api').then((publicApi) => {
      publicApi.forEach(({ method, handler }) => {
        api[method] = async function (...args) {
          return ipcRenderer.invoke(handler, ...args);
        };
      });

      publicEvents.forEach((eventName) => {
        const methodName = _.camelCase(`on-${eventName}`);

        apiEvents[methodName] = function (callback) {
          ipcRenderer.on(eventName, (event, ...args) => callback(...args));
        };
      });

      contextBridge.exposeInMainWorld('api', api);
      contextBridge.exposeInMainWorld('apiEvents', apiEvents);
    });
  },
};
