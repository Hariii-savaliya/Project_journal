const form = document.getElementById("journal-form");
const titleInput = document.getElementById("entry-title");
const tagsInput = document.getElementById("entry-tags");
const textInput = document.getElementById("entry-text");
const searchInput = document.getElementById("search-input");
const tagFilter = document.getElementById("tag-filter");
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

function parseTags(tagsText) {
  return tagsText
    .split(",")
    .map((tag) => tag.trim())
    .filter(Boolean);
}

function getUniqueTags(entries) {
  const tags = new Set();
  entries.forEach((entry) => {
    (entry.tags || []).forEach((tag) => tags.add(tag));
  });
  return [...tags].sort((a, b) => a.localeCompare(b));
}

function updateTagFilterOptions(entries) {
  const uniqueTags = getUniqueTags(entries);
  const selectedValue = tagFilter.value;
  tagFilter.innerHTML = `<option value="">All tags</option>` +
    uniqueTags
      .map((tag) => `<option value="${escapeHtml(tag)}">${escapeHtml(tag)}</option>`)
      .join("");
  if (uniqueTags.includes(selectedValue)) {
    tagFilter.value = selectedValue;
  } else {
    tagFilter.value = "";
  }
}

function filterEntries(entries) {
  const query = searchInput.value.trim().toLowerCase();
  const selectedTag = tagFilter.value;

  return entries.filter((entry) => {
    const title = entry.title.toLowerCase();
    const text = entry.text.toLowerCase();
    const matchesText =
      query === "" || title.includes(query) || text.includes(query);
    const matchesTag =
      selectedTag === "" || (entry.tags || []).includes(selectedTag);
    return matchesText && matchesTag;
  });
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
  tagsInput.value = entry.tags ? entry.tags.join(", ") : "";
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
  const tagsHtml = entry.tags && entry.tags.length
    ? `<div class="entry-tags">${entry.tags.map((tag) => `<span class="entry-tag">${escapeHtml(tag)}</span>`).join("")}</div>`
    : "";

  const li = document.createElement("li");
  li.className = "entry-card";
  li.innerHTML = `
    <div class="entry-content">
      <p class="entry-date">${escapeHtml(entry.date)}</p>
      <h3 class="entry-title">${escapeHtml(entry.title)}</h3>
      ${tagsHtml}
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
    updateTagFilterOptions(entries);
    emptyState.textContent = "No entries yet. Write your first one above.";
    emptyState.classList.remove("hidden");
    return;
  }

  updateTagFilterOptions(entries);
  const visibleEntries = filterEntries(entries);

  if (visibleEntries.length === 0) {
    emptyState.textContent = "No entries match your search or tag filter.";
    emptyState.classList.remove("hidden");
    return;
  }

  emptyState.classList.add("hidden");
  visibleEntries.forEach((entry) => {
    entriesList.appendChild(renderEntry(entry));
  });
}

form.addEventListener("submit", (event) => {
  event.preventDefault();

  const title = titleInput.value.trim();
  const text = textInput.value.trim();

  if (!title || !text) return;

  const entries = loadEntries();

  const tags = parseTags(tagsInput.value);

  if (editingEntryId) {
    const updatedEntries = entries.map((entry) =>
      entry.id === editingEntryId ? { ...entry, title, text, tags } : entry
    );
    saveEntries(updatedEntries);
    renderEntries();
    cancelEditing();
    return;
  }

  const entry = {
    id: Date.now(),
    title,
    tags,
    text,
    date: formatTodayDate(),
  };

  entries.unshift(entry);
  saveEntries(entries);
  renderEntries();

  form.reset();
  titleInput.focus();
});

searchInput.addEventListener("input", renderEntries);
tagFilter.addEventListener("change", renderEntries);

cancelButton.addEventListener("click", cancelEditing);

renderEntries();
cancelEditing();
