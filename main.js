const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const screenshot = require('screenshot-desktop');
const fs = require('fs');

let mainWindow;

app.whenReady().then(() => {
  mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      sandbox: false,
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  // Load the dashboard initially
  mainWindow.loadFile(path.join(__dirname, 'renderer', 'dashboard.html'));

  // Redirect to login page if no authentication token is found
  mainWindow.webContents.once('dom-ready', () => {
    mainWindow.webContents.executeJavaScript(`
      if (!localStorage.getItem('token')) {
        window.location.href = '${path.resolve(__dirname, 'renderer', 'login.html').replace(/\\/g, '/')}';
      }
    `);
  });
});

// Screenshot capture request handler - save screenshots to backend/uploads
ipcMain.on('capture-screenshot', async (event) => {
  console.log('Received capture-screenshot request from renderer');
  try {
    const uploadsDir = path.join(__dirname, './backend/uploads');
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }
    const screenshotPath = path.join(uploadsDir, `screenshot-${Date.now()}.jpg`);
    await screenshot({ filename: screenshotPath });
    console.log('Screenshot captured at:', screenshotPath);

    // Send the screenshot path back to the renderer
    event.sender.send('screenshot-captured', screenshotPath);
  } catch (error) {
    console.error('Error capturing screenshot:', error);
    event.sender.send('screenshot-error', error.message);
  }
});
