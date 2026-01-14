import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('nexusDesktop', {
  send: (channel: string, data: any) => {
    const validChannels = ['toMain'];
    if (validChannels.includes(channel)) {
      ipcRenderer.send(channel, data);
    }
  },
  windowControl: (action: 'minimize' | 'maximize' | 'close') => {
    ipcRenderer.send('window-control', action);
  },
  receive: (channel: string, func: (...args: any[]) => void) => {
    const validChannels = ['fromMain'];
    if (validChannels.includes(channel)) {
      ipcRenderer.on(channel, (event, ...args) => func(...args));
    }
  },
});
