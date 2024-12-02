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
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  mainWindow.loadFile('./renderer/dashboard.html');
});

// screenshot capture request handler - save screenshots to backend/uploads
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

    // send the screenshot path back to the renderer
    event.sender.send('screenshot-captured', screenshotPath);
  } catch (error) {
    console.error('Error capturing screenshot:', error);
    event.sender.send('screenshot-error', error.message);
  }
});
