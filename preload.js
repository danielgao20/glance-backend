const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  sendMessage: (channel, data) => {
    console.log(`Sending message on channel: ${channel}, with data:`, data);
    ipcRenderer.send(channel, data);
  },
  onMessage: (channel, callback) => {
    console.log(`Listening for messages on channel: ${channel}`);
    ipcRenderer.on(channel, (event, ...args) => callback(...args));
  },
});
