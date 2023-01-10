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
  app, BrowserWindow, shell
} from 'electron';
import { release } from 'os';
import { join } from 'path';
import ipc from './ipc-main.js';

process.env.DIST_ELECTRON = join(__dirname, '..');
process.env.DIST = join(process.env.DIST_ELECTRON, '../dist');
process.env.PUBLIC = process.env.VITE_DEV_SERVER_URL
  ? join(process.env.DIST_ELECTRON, '../public')
  : process.env.DIST;

// Disable GPU Acceleration for Windows 7
if (release().startsWith('6.1')) app.disableHardwareAcceleration();

// Set application name for Windows 10+ notifications
if (process.platform === 'win32') app.setAppUserModelId(app.getName());

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
      height: '25px',
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

  controller.events = win.webContents;
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
