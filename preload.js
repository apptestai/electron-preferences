'use strict';

const electron = require('electron');
const { contextBridge } = electron;
const { ipcRenderer } = electron;

contextBridge.exposeInMainWorld('api', {
	getSections: () => ipcRenderer.sendSync('getSections'),
	getPreferences: () => ipcRenderer.sendSync('getPreferences'),
	getDefaults: () => ipcRenderer.sendSync('getDefaults'),
	setPreferences: (key, preferences) => ipcRenderer.send('setPreferences', key, preferences),
	showOpenDialog: dialogOptions => ipcRenderer.sendSync('showOpenDialog', dialogOptions),
});
