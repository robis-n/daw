const noteList = document.getElementById("noteList");
const noteTitle = document.getElementById("noteTitle");
const noteBody = document.getElementById("noteBody");
const noteMeta = document.getElementById("noteMeta");
const searchInput = document.getElementById("searchInput");
const newNoteButton = document.getElementById("newNote");
const deleteNoteButton = document.getElementById("deleteNote");
const favoriteNoteButton = document.getElementById("favoriteNote");
const exportNoteButton = document.getElementById("exportNote");
const syncStatus = document.getElementById("syncStatus");
const appVersion = document.getElementById("appVersion");
const wordCount = document.getElementById("wordCount");
const noteCount = document.getElementById("noteCount");
const emptyState = document.getElementById("emptyState");

const DEFAULT_NOTE = {
  id: crypto.randomUUID(),
  title: "First Light",
  body: "Write your poems here...",
  updatedAt: new Date().toISOString(),
  favorite: false,
};

let notes = [];
let activeNoteId = null;
let debounceTimer;

const storage = window.nocturne?.notes;

const formatDate = (iso) => {
  const date = new Date(iso);
  return date.toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const countWords = (text) => {
  if (!text) {
    return 0;
  }
  return text.trim().split(/\s+/).filter(Boolean).length;
};

const updateStats = () => {
  const current = notes.find((item) => item.id === activeNoteId);
  noteCount.textContent = `${notes.length} ${notes.length === 1 ? "note" : "notes"}`;
  wordCount.textContent = `${countWords(current?.body)} words`;
  emptyState.classList.toggle("show", !current);
};

const saveNotes = async () => {
  if (!storage) {
    return;
  }
  await storage.save(notes);
  syncStatus.textContent = "Saved to disk.";
};

const renderNoteList = () => {
  const query = searchInput.value.toLowerCase();
  const filtered = notes
    .filter((note) =>
      `${note.title} ${note.body}`.toLowerCase().includes(query)
    )
    .sort((a, b) => {
      if (a.favorite !== b.favorite) {
        return a.favorite ? -1 : 1;
      }
      return new Date(b.updatedAt) - new Date(a.updatedAt);
    });

  noteList.innerHTML = "";

  filtered.forEach((note) => {
    const card = document.createElement("div");
    card.className = "note-card";
    if (note.id === activeNoteId) {
      card.classList.add("active");
    }

    const title = document.createElement("h3");
    title.textContent = note.title || "Untitled";

    const meta = document.createElement("p");
    meta.textContent = `${note.favorite ? "★" : "•"} ${formatDate(
      note.updatedAt
    )}`;

    card.append(title, meta);
    card.addEventListener("click", () => selectNote(note.id));
    noteList.append(card);
  });
};

const selectNote = (noteId) => {
  activeNoteId = noteId;
  const note = notes.find((item) => item.id === noteId);
  if (!note) {
    noteTitle.value = "";
    noteBody.value = "";
    noteMeta.textContent = "Select a note to begin.";
    favoriteNoteButton.textContent = "☆ Favorite";
    updateStats();
    return;
  }

  noteTitle.value = note.title;
  noteBody.value = note.body;
  noteMeta.textContent = `Last edited ${formatDate(note.updatedAt)}`;
  favoriteNoteButton.textContent = note.favorite ? "★ Favorited" : "☆ Favorite";
  updateStats();
  renderNoteList();
};

const updateActiveNote = async () => {
  const note = notes.find((item) => item.id === activeNoteId);
  if (!note) {
    return;
  }

  note.title = noteTitle.value.trim() || "Untitled";
  note.body = noteBody.value;
  note.updatedAt = new Date().toISOString();

  noteMeta.textContent = `Last edited ${formatDate(note.updatedAt)}`;
  await saveNotes();
  renderNoteList();
  updateStats();
};

const scheduleSave = () => {
  syncStatus.textContent = "Saving...";
  clearTimeout(debounceTimer);
  debounceTimer = setTimeout(updateActiveNote, 250);
};

const createNote = async () => {
  const newNote = {
    id: crypto.randomUUID(),
    title: "Untitled",
    body: "",
    updatedAt: new Date().toISOString(),
    favorite: false,
  };
  notes.unshift(newNote);
  activeNoteId = newNote.id;
  await saveNotes();
  renderNoteList();
  selectNote(activeNoteId);
};

const deleteNote = async () => {
  if (!activeNoteId) {
    return;
  }

  notes = notes.filter((note) => note.id !== activeNoteId);

  if (notes.length === 0) {
    notes = [{ ...DEFAULT_NOTE, id: crypto.randomUUID() }];
  }

  activeNoteId = notes[0].id;
  await saveNotes();
  renderNoteList();
  selectNote(activeNoteId);
};

const toggleFavorite = async () => {
  const note = notes.find((item) => item.id === activeNoteId);
  if (!note) {
    return;
  }

  note.favorite = !note.favorite;
  await saveNotes();
  renderNoteList();
  selectNote(note.id);
};

const exportNote = async () => {
  const note = notes.find((item) => item.id === activeNoteId);
  if (!note || !storage) {
    return;
  }

  syncStatus.textContent = "Exporting...";
  const result = await storage.export({ title: note.title, body: note.body });
  syncStatus.textContent = result?.ok ? "Exported." : "Export canceled.";
};

const loadNotes = async () => {
  if (!storage) {
    notes = [DEFAULT_NOTE];
    activeNoteId = notes[0].id;
    return;
  }

  const loaded = await storage.load();
  if (Array.isArray(loaded) && loaded.length > 0) {
    notes = loaded;
  } else {
    notes = [DEFAULT_NOTE];
  }
  activeNoteId = notes[0]?.id ?? null;
};

searchInput.addEventListener("input", renderNoteList);
newNoteButton.addEventListener("click", createNote);
deleteNoteButton.addEventListener("click", deleteNote);
favoriteNoteButton.addEventListener("click", toggleFavorite);
exportNoteButton.addEventListener("click", exportNote);
noteTitle.addEventListener("input", scheduleSave);
noteBody.addEventListener("input", scheduleSave);

appVersion.textContent = window.nocturne?.version ?? "0.2.0";

loadNotes().then(() => {
  renderNoteList();
  selectNote(activeNoteId);
});
