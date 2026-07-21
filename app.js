const form = document.getElementById("journal-form");
const titleInput = document.getElementById("entry-title");
const textInput = document.getElementById("entry-text");
const entriesList = document.getElementById("entries-list");
const emptyState = document.getElementById("empty-state");
const formTitle = document.getElementById("form-title");
const saveButton = document.getElementById("save-entry-btn");
const cancelButton = document.getElementById("cancel-edit-btn");

const STORAGE_KEY = "journal-entries";
let editingEntryId = null;

function formatTodayDate() {
  return new Date().toLocaleDateString(undefined, {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

function loadEntries() {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

function saveEntries(entries) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
}

function escapeHtml(str) {
  const div = document.createElement("div");
  div.textContent = str;
  return div.innerHTML;
}

function cancelEditing() {
  editingEntryId = null;
  form.reset();
  formTitle.textContent = "New Entry";
  saveButton.textContent = "Save Entry";
  cancelButton.classList.add("hidden");
}

function startEditingEntry(id) {
  const entry = loadEntries().find((item) => item.id === id);

  if (!entry) return;

  editingEntryId = id;
  titleInput.value = entry.title;
  textInput.value = entry.text;
  formTitle.textContent = "Edit Entry";
  saveButton.textContent = "Update Entry";
  cancelButton.classList.remove("hidden");
  titleInput.focus();
}

function deleteEntry(id) {
  const entries = loadEntries().filter((entry) => entry.id !== id);
  saveEntries(entries);

  if (editingEntryId === id) {
    cancelEditing();
  }

  renderEntries();
}

function renderEntry(entry) {
  const li = document.createElement("li");
  li.className = "entry-card";
  li.innerHTML = `
    <div class="entry-content">
      <p class="entry-date">${escapeHtml(entry.date)}</p>
      <h3 class="entry-title">${escapeHtml(entry.title)}</h3>
      <p class="entry-text">${escapeHtml(entry.text)}</p>
    </div>
    <div class="entry-actions">
      <button type="button" class="btn-action btn-edit">Edit</button>
      <button type="button" class="btn-action btn-delete">Delete</button>
    </div>
  `;

  li.querySelector(".btn-edit").addEventListener("click", () => {
    startEditingEntry(entry.id);
  });

  li.querySelector(".btn-delete").addEventListener("click", () => {
    deleteEntry(entry.id);
  });

  return li;
}

function renderEntries() {
  const entries = loadEntries();
  entriesList.innerHTML = "";

  if (entries.length === 0) {
    emptyState.classList.remove("hidden");
    return;
  }

  emptyState.classList.add("hidden");
  entries.forEach((entry) => {
    entriesList.appendChild(renderEntry(entry));
  });
}

form.addEventListener("submit", (event) => {
  event.preventDefault();

  const title = titleInput.value.trim();
  const text = textInput.value.trim();

  if (!title || !text) return;

  const entries = loadEntries();

  if (editingEntryId) {
    const updatedEntries = entries.map((entry) =>
      entry.id === editingEntryId ? { ...entry, title, text } : entry
    );
    saveEntries(updatedEntries);
    renderEntries();
    cancelEditing();
    return;
  }

  const entry = {
    id: Date.now(),
    title,
    text,
    date: formatTodayDate(),
  };

  entries.unshift(entry);
  saveEntries(entries);
  renderEntries();

  form.reset();
  titleInput.focus();
});

cancelButton.addEventListener("click", cancelEditing);

renderEntries();
cancelEditing();
