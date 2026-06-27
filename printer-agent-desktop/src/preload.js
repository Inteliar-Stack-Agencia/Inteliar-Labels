const { contextBridge, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld('agent', {
  activateLicense: (key) => ipcRenderer.invoke('activate-license', key),
  getStatus: () => ipcRenderer.invoke('get-status'),
  openConfig: () => ipcRenderer.invoke('open-config'),
  restartAgent: () => ipcRenderer.invoke('restart-agent'),
})
