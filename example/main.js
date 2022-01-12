'use strict';
const _ = require('lodash');
const electron = require('electron');
const { app } = electron;
const { nativeTheme } = electron;
const { BrowserWindow } = electron;
const path = require('path');
const url = require('url');
const preferences = require('./preferences');

nativeTheme.themeSource = preferences.preferences?.theme?.theme ?? 'system';

preferences.on('save', (key, data) => {
  console.log(preferences);
  console.log(key);
  console.log('Preferences were saved.', JSON.stringify(data, null, 4));
  if (key === 'abc-button') {
    preferences.setLoading(true);
    // nativeTheme.themeSource = preferences?.theme?.theme ?? 'system';
    // const places = Object.freeze(_.cloneDeep(data.lists.places));
    // places.push('ZZZZZ');
    // preferences.value('places', places);
    const wakeUpTime = Date.now() + 10000;
    while (Date.now() < wakeUpTime) {}
    // console.log('CCCCCCCCCC');
    preferences.setLoading(false);
  }
});

let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 700,
    'accept-first-mouse': true,
    webPreferences: {
      preload: path.join(__dirname, './preload.js'),
      contextIsolation: true,
    },
  });

  mainWindow.loadURL(
    url.format({
      pathname: path.join(__dirname, 'index.html'),
      protocol: 'file:',
      slashes: true,
    }),
  );

  // MainWindow.webContents.openDevTools();

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

app.on('ready', createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (mainWindow === null) {
    createWindow();
  }
});
