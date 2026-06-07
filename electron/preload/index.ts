import { contextBridge, ipcRenderer } from 'electron'

contextBridge.exposeInMainWorld('telegramAPI', {
  // API methods will be exposed here
})
