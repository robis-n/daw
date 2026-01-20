const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("nocturne", {
  version: "0.2.0",
  notes: {
    load: () => ipcRenderer.invoke("notes:load"),
    save: (notes) => ipcRenderer.invoke("notes:save", notes),
    export: (payload) => ipcRenderer.invoke("notes:export", payload),
  },
});
