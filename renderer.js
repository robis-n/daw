const noteList = document.getElementById("noteList");
const noteTitle = document.getElementById("noteTitle");
const noteBody = document.getElementById("noteBody");
const noteMeta = document.getElementById("noteMeta");
const searchInput = document.getElementById("searchInput");
const newNoteButton = document.getElementById("newNote");
const deleteNoteButton = document.getElementById("deleteNote");
const favoriteNoteButton = document.getElementById("favoriteNote");
const syncStatus = document.getElementById("syncStatus");
const appVersion = document.getElementById("appVersion");

const STORAGE_KEY = "nocturne-notes";
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

const loadNotes = () => {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) {
    notes = [DEFAULT_NOTE];
    saveNotes();
  } else {
    notes = JSON.parse(raw);
  }

  activeNoteId = notes[0]?.id ?? null;
};

const saveNotes = () => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(notes));
  syncStatus.textContent = "Saved locally.";
};

const formatDate = (iso) => {
  const date = new Date(iso);
  return date.toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
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
    return;
  }

  noteTitle.value = note.title;
  noteBody.value = note.body;
  noteMeta.textContent = `Last edited ${formatDate(note.updatedAt)}`;
  favoriteNoteButton.textContent = note.favorite ? "★ Favorited" : "☆ Favorite";
  renderNoteList();
};

const updateActiveNote = () => {
  const note = notes.find((item) => item.id === activeNoteId);
  if (!note) {
    return;
  }

  note.title = noteTitle.value.trim() || "Untitled";
  note.body = noteBody.value;
  note.updatedAt = new Date().toISOString();

  noteMeta.textContent = `Last edited ${formatDate(note.updatedAt)}`;
  saveNotes();
  renderNoteList();
};

const scheduleSave = () => {
  syncStatus.textContent = "Saving...";
  clearTimeout(debounceTimer);
  debounceTimer = setTimeout(updateActiveNote, 250);
};

const createNote = () => {
  const newNote = {
    id: crypto.randomUUID(),
    title: "Untitled",
    body: "",
    updatedAt: new Date().toISOString(),
    favorite: false,
  };
  notes.unshift(newNote);
  activeNoteId = newNote.id;
  saveNotes();
  renderNoteList();
  selectNote(activeNoteId);
};

const deleteNote = () => {
  if (!activeNoteId) {
    return;
  }

  notes = notes.filter((note) => note.id !== activeNoteId);

  if (notes.length === 0) {
    notes = [{ ...DEFAULT_NOTE, id: crypto.randomUUID() }];
  }

  activeNoteId = notes[0].id;
  saveNotes();
  renderNoteList();
  selectNote(activeNoteId);
};

const toggleFavorite = () => {
  const note = notes.find((item) => item.id === activeNoteId);
  if (!note) {
    return;
  }

  note.favorite = !note.favorite;
  saveNotes();
  renderNoteList();
  selectNote(note.id);
};

searchInput.addEventListener("input", renderNoteList);
newNoteButton.addEventListener("click", createNote);
deleteNoteButton.addEventListener("click", deleteNote);
favoriteNoteButton.addEventListener("click", toggleFavorite);
noteTitle.addEventListener("input", scheduleSave);
noteBody.addEventListener("input", scheduleSave);

appVersion.textContent = window.nocturne?.version ?? "0.1.0";

loadNotes();
renderNoteList();
selectNote(activeNoteId);
