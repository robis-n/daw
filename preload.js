const { contextBridge } = require("electron");

contextBridge.exposeInMainWorld("nocturne", {
  version: "0.1.0",
});
