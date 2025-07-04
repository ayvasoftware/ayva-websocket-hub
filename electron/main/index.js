// The build directory structure
//
// ├─┬ dist-electron
// │ ├─┬ main
// │ │ └── index.js    > Electron-Main
// │ └─┬ preload
// │   └── index.js    > Preload-Scripts
// ├─┬ dist
// │ └── index.html    > Electron-Renderer
//
import {
  app, BrowserWindow, Menu, shell
} from 'electron';
import { release } from 'os';
import { join } from 'path';
import ipc from './ipc-main.js';

process.env.DIST_ELECTRON = join(__dirname, '..');
process.env.DIST = join(process.env.DIST_ELECTRON, '../dist');
process.env.PUBLIC = process.env.VITE_DEV_SERVER_URL
  ? join(process.env.DIST_ELECTRON, '../public')
  : process.env.DIST;

const isWindows = process.platform === 'win32';

// Disable GPU Acceleration for Windows 7
if (release().startsWith('6.1')) app.disableHardwareAcceleration();

// Set application name for Windows 10+ notifications
if (isWindows) app.setAppUserModelId(app.getName());

if (!app.requestSingleInstanceLock()) {
  app.quit();
  process.exit(0);
}

let win = null;
let controller = null;

const preload = join(__dirname, '../preload/index.js');
const indexHtml = join(process.env.DIST, 'index.html');
const devUrl = process.env.VITE_DEV_SERVER_URL;
const width = 500;
const height = 250;
const maxHeight = 500;

Menu.setApplicationMenu(null);

async function createWindow () {
  win = new BrowserWindow({
    width,
    height,
    title: 'Ayva WebSocket Hub',
    minWidth: width,
    minHeight: height,
    maxWidth: width,
    maxHeight: maxHeight,
    fullscreen: false,
    titleBarStyle: 'hidden',
    titleBarOverlay: {
      color: '#000000',
      symbolColor: '#6784bb',
      height: isWindows ? 25 : '25px',
    },
    icon: join(process.env.PUBLIC, 'ayva.ico'),
    webPreferences: {
      preload,
      devTools: !app.isPackaged,
    },
  });

  if (devUrl) {
    win.loadURL(devUrl);
    win.webContents.openDevTools();
  } else {
    win.loadFile(indexHtml);
  }

  // Make all links open with the browser, not with the application
  win.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith('https:')) {
      shell.openExternal(url);
    }
    return { action: 'deny' };
  });

  if (!controller) {
    controller = ipc.init();
  }

  const { webContents } = win;

  controller.events = {
    send (...args) {
      // Make sure we never try to send events to a destroyed window...
      if (!webContents.isDestroyed()) {
        webContents.send(...args);
      }
    },
  };

  webContents.on('select-bluetooth-device', (event, devices, callback) => {
    event.preventDefault();
    const rubjoy = devices.find((device) => device.deviceName === 'Bluno');

    if (rubjoy) {
      callback(rubjoy.deviceId);
    }
  });
}

app.whenReady().then(() => createWindow());

app.on('window-all-closed', () => {
  win = null;
  app.quit();
});

app.on('second-instance', () => {
  if (win) {
    // Focus on the main window if the user tried to open another
    if (win.isMinimized()) win.restore();
    win.focus();
  }
});

app.on('activate', () => {
  const allWindows = BrowserWindow.getAllWindows();
  if (allWindows.length) {
    allWindows[0].focus();
  } else {
    createWindow();
  }
});
