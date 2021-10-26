'use strict';

const electron = require('electron');
const { contextBridge } = electron;
const { ipcRenderer } = electron;

contextBridge.exposeInMainWorld('api', {
  ipcRenderer: {
    // MyPing() {
    //   ipcRenderer.send('ipc-example', 'ping');
    // },
    on(channel, func) {
      const validChannels = [
        'SHOW_SPINNER',
        'HIDE_SPINNER',
        'preferencesUpdated',
        'isLoading',
      ];
      if (validChannels.includes(channel)) {
        // Deliberately strip event as it includes `sender`
        ipcRenderer.on(channel, (event, ...args) => func(...args));
      }
    },
  },

  getSections: () => ipcRenderer.sendSync('getSections'),
  getPreferences: () => ipcRenderer.sendSync('getPreferences'),
  getDefaults: () => ipcRenderer.sendSync('getDefaults'),
  setPreferences: (key, preferences) =>
    ipcRenderer.send('setPreferences', key, preferences),
  showOpenDialog: (dialogOptions) =>
    ipcRenderer.sendSync('showOpenDialog', dialogOptions),
});
