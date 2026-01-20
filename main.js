const { app, BrowserWindow, nativeTheme, ipcMain, dialog } = require("electron");
const path = require("path");
const fs = require("fs/promises");

const NOTES_FILE = "notes.json";

const getNotesPath = () => path.join(app.getPath("userData"), NOTES_FILE);

const readNotes = async () => {
  const notesPath = getNotesPath();
  try {
    const raw = await fs.readFile(notesPath, "utf-8");
    return JSON.parse(raw);
  } catch (error) {
    if (error.code === "ENOENT") {
      return [];
    }
    throw error;
  }
};

const writeNotes = async (notes) => {
  const notesPath = getNotesPath();
  await fs.writeFile(notesPath, JSON.stringify(notes, null, 2), "utf-8");
};

const createWindow = () => {
  nativeTheme.themeSource = "dark";

  const mainWindow = new BrowserWindow({
    width: 1100,
    height: 720,
    minWidth: 900,
    minHeight: 600,
    backgroundColor: "#0f1115",
    titleBarStyle: "hiddenInset",
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  mainWindow.loadFile(path.join(__dirname, "index.html"));
};

app.whenReady().then(() => {
  ipcMain.handle("notes:load", async () => {
    return readNotes();
  });

  ipcMain.handle("notes:save", async (_event, notes) => {
    await writeNotes(notes);
    return { ok: true };
  });

  ipcMain.handle("notes:export", async (_event, payload) => {
    const { title, body } = payload;
    const { canceled, filePath } = await dialog.showSaveDialog({
      title: "Export note",
      defaultPath: `${title || "note"}.txt`,
      filters: [{ name: "Text", extensions: ["txt"] }],
    });

    if (canceled || !filePath) {
      return { ok: false };
    }

    await fs.writeFile(filePath, body ?? "", "utf-8");
    return { ok: true, filePath };
  });

  createWindow();

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});
