'use strict';

const electron = require('electron');
const { app, BrowserWindow, ipcMain, webContents, dialog } = electron;
const path = require('path');
const url = require('url');
const fs = require('fs');
const _ = require('lodash');
const { EventEmitter2 } = require('eventemitter2');
const loadJsonFile = require('load-json-file');
const writeJsonFile = require('write-json-file');

class ElectronPreferences extends EventEmitter2 {
  constructor(options = {}) {
    super();

    _.defaultsDeep(options, {
      sections: [],
      webPreferences: {
        devTools: false,
      },
    });

    options.sections.forEach((section, sectionIdx) => {
      _.defaultsDeep(section, {
        form: {
          groups: [],
        },
      });
      section.form.groups = section.form.groups.map((group, groupIdx) => {
        group.id = 'group' + sectionIdx + groupIdx;
        return group;
      });
    });

    this.options = options;

    if (!this.dataStore) {
      throw new Error("The 'dataStore' option is required.");
    }

    // Load preferences file if exists
    try {
      if (fs.existsSync(this.dataStore)) {
        this.preferences = loadJsonFile.sync(this.dataStore);
      }
    } catch (err) {
      console.error(`Datastore error - ${err}`);
      this.preferences = null;
    }

    if (this.preferences) {
      // Set default preference values
      _.keys(this.defaults).forEach((prefDefault) => {
        if (!(prefDefault in this.preferences)) {
          this.preferences[prefDefault] = this.defaults[prefDefault];
        }
      });
    } else {
      this.preferences = this.defaults;
    }

    if (_.isFunction(options.onLoad)) {
      this.preferences = options.onLoad(this.preferences);
    }

    this.save();

    ipcMain.on('showPreferences', (_) => {
      this.show();
    });

    ipcMain.on('getSections', (event) => {
      event.returnValue = this.options.sections;
    });

    ipcMain.on('restoreDefaults', (_) => {
      this.preferences = this.defaults;
      this.save();
      this.broadcast();
    });

    ipcMain.on('getDefaults', (event) => {
      event.returnValue = this.defaults;
    });

    ipcMain.on('getPreferences', (event) => {
      // Renderer process(브라우저) 에서 getPreferences 호출시 발생
      //   console.log("GET_PREFEREMNCE");
      event.returnValue = this.preferences;
    });

    ipcMain.on('setPreferences', (event, key, value) => {
      this.preferences = value;
      this.save();
      this.broadcast();
      this.emit('save', key, Object.freeze(_.cloneDeep(this.preferences)));
      event.returnValue = true;
    });

    ipcMain.on('showOpenDialog', (event, dialogOptions) => {
      event.returnValue = dialog.showOpenDialogSync(dialogOptions);
    });

    if (_.isFunction(options.afterLoad)) {
      options.afterLoad(this);
    }
  }

  get dataStore() {
    return this.options.dataStore;
  }

  get browserWindowOverrides() {
    return this.options.browserWindowOverrides;
  }

  get defaults() {
    return this.options.defaults || {};
  }

  get preferences() {
    return this._preferences;
  }

  set preferences(value) {
    this._preferences = value;
  }

  save() {
    // Main process에서 value 저장시 발생
    writeJsonFile(this.dataStore, this.preferences, {
      indent: 4,
    });
  }

  value(key, value) {
    // Main process에서 value 변화시 발생
    // Place the key/value pair(s) into this.preferences var
    if (_.isArray(key)) {
      key.forEach(({ key, value }) => {
        _.set(this.preferences, key, value);
      });
      this.save();
      this.broadcast();
    } else if (!_.isUndefined(key) && !_.isUndefined(value)) {
      _.set(this.preferences, key, value);
      this.save();
      this.broadcast();
    } else if (_.isUndefined(value)) {
      // Value is undefined
      return _.cloneDeep(_.get(this.preferences, key));
    } else {
      // Key is undefined
      return _.cloneDeep(this.preferences);
    }
  }

  broadcast() {
    webContents.getAllWebContents().forEach((wc) => {
      wc.send('preferencesUpdated', this.preferences);
    });
  }

  setLoading(isLoading) {
    webContents.getAllWebContents().forEach((wc) => {
      wc.send('isLoading', isLoading);
    });
  }

  getBrowserWindowOptions() {
    let browserWindowOpts = {
      title: 'Preferences',
      width: 800,
      maxWidth: 800,
      height: 600,
      maxHeight: 600,
      resizable: false,
      acceptFirstMouse: true,
      maximizable: false,
      backgroundColor: '#E7E7E7',
      show: false,
      webPreferences: this.options.webPreferences,
    };

    const defaultWebPreferences = {
      nodeIntegration: false,
      enableRemoteModule: false,
      preload: path.join(__dirname, './preload.js'),
    };

    const unOverridableWebPreferences = {
      contextIsolation: true,
      devTools: this.options.debug ? true : undefined,
    };

    // User provider `browserWindow`, we load those
    if (this.options.browserWindowOverrides) {
      browserWindowOpts = Object.assign(
        browserWindowOpts,
        this.options.browserWindowOverrides,
      );
    }

    if (browserWindowOpts.webPreferences) {
      browserWindowOpts.webPreferences = Object.assign(
        defaultWebPreferences,
        browserWindowOpts.webPreferences,
      );
    } else {
      browserWindowOpts.webPreferences = defaultWebPreferences;
    }

    browserWindowOpts.webPreferences = Object.assign(
      browserWindowOpts.webPreferences,
      unOverridableWebPreferences,
    );

    return browserWindowOpts;
  }

  show() {
    if (this.prefsWindow) {
      this.prefsWindow.focus();

      if (this.options.debug) {
        this.prefsWindow.webContents.openDevTools();
      }

      return this.prefsWindow;
    }

    this.prefsWindow = new BrowserWindow(this.getBrowserWindowOptions());

    if (this.options.menuBar) {
      this.prefsWindow.setMenu(this.options.menuBar);
    } else {
      this.prefsWindow.removeMenu();
    }

    this.prefsWindow.loadURL(
      url.format({
        pathname: path.join(__dirname, 'build/index.html'),
        protocol: 'file:',
        slashes: true,
      }),
    );

    this.prefsWindow.once('ready-to-show', () => {
      // Show: false by default, then show when ready to prevent page "flicker"
      this.prefsWindow.show();
    });

    this.prefsWindow.webContents.on('dom-ready', async () => {
      // Load custom css file
      if (this.options.css) {
        const file = path
          .join(app.getAppPath(), this.options.css)
          .replace(/\\/g, '/'); // Make sure it also works in Windows

        try {
          if (await fs.promises.stat(file)) {
            await this.prefsWindow.webContents.executeJavaScript(` \
					  		var f = document.createElement("link"); \
					  		f.rel = "stylesheet"; \
					  		f.type = "text/css"; \
					  		f.href = "${file}"; \
					  		document.getElementsByTagName("head")[0].appendChild(f) \
					  		;0
					  	`); // ";0" is needed so nothing is returned (especially not an non-cloneable IPC object) by JS.
          }
        } catch (err) {
          console.error(`Could not load css file ${file}: ${err}`);
        }
      }
    });

    this.prefsWindow.on('closed', () => {
      this.prefsWindow = null;
    });

    if (this.options.debug) {
      this.prefsWindow.webContents.openDevTools();
    }

    return this.prefsWindow;
  }
}

module.exports = ElectronPreferences;
