const { app, BrowserWindow, dialog } = require('electron');
const path = require('path');
const { autoUpdater } = require('electron-updater');
const isDev = !app.isPackaged;

function createWindow() {
  const win = new BrowserWindow({
    width: 1200,
    height: 800,
    backgroundColor: '#030712',
    icon: path.join(__dirname, '../icon.icns'),
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      nodeIntegration: false,
      contextIsolation: true,
    },
  });

  if (isDev) {
    win.loadURL('http://localhost:3000');
    win.webContents.openDevTools();
  } else {
    win.loadFile(path.join(__dirname, '../dist/index.html'));
  }

  // Handle background playback if necessary (Electron usually keeps running)
  win.on('closed', () => {
    if (process.platform !== 'darwin') {
      app.quit();
    }
  });

  return win;
}

app.whenReady().then(() => {
  const win = createWindow();

  // Set up auto updater
  if (!isDev) {
    autoUpdater.checkForUpdatesAndNotify();

    autoUpdater.on('update-available', () => {
      dialog.showMessageBox(win, {
        type: 'info',
        title: 'Actualización disponible',
        message: 'Hay una nueva versión de OmniFrequency disponible. Descargando ahora...',
      });
    });

    autoUpdater.on('update-downloaded', () => {
      dialog.showMessageBox(win, {
        type: 'info',
        title: 'Actualización lista',
        message: 'Actualización descargada. La aplicación se reiniciará para instalarla.',
        buttons: ['Reiniciar y Actualizar']
      }).then(() => {
        autoUpdater.quitAndInstall();
      });
    });
  }

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

