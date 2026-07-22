const els = {
  form: document.getElementById("journal-form"),
  titleInput: document.getElementById("entry-title"),
  tagsInput: document.getElementById("entry-tags"),
  textInput: document.getElementById("entry-text"),
  searchInput: document.getElementById("search-input"),
  tagFilter: document.getElementById("tag-filter"),
  exportButton: document.getElementById("export-btn"),
  entriesList: document.getElementById("entries-list"),
  emptyState: document.getElementById("empty-state"),
  formTitle: document.getElementById("form-title"),
  saveButton: document.getElementById("save-entry-btn"),
  cancelButton: document.getElementById("cancel-edit-btn"),
  themeToggle: document.getElementById("theme-toggle"),
};

const {
  form,
  titleInput,
  tagsInput,
  textInput,
  searchInput,
  tagFilter,
  exportButton,
  entriesList,
  emptyState,
  formTitle,
  saveButton,
  cancelButton,
  themeToggle,
} = els;

const STORAGE_KEY = "journal-entries";
const THEME_KEY = "journal-theme";
let editingEntryId = null;

function formatTodayDate() {
  return new Date().toLocaleDateString(undefined, {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

function formatTodayIso() {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, "0");
  const day = String(today.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function parseLongDateToIso(displayDate) {
  const match = displayDate.match(/^[^,]+,\s+([A-Za-z]+)\s+(\d{1,2}),\s+(\d{4})$/);
  if (!match) return displayDate;
  const [, monthName, day, year] = match;
  const monthNames = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];
  const month = monthNames.indexOf(monthName);
  if (month === -1) return displayDate;
  return `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

function normalizeEntry(entry) {
  const tags = Array.isArray(entry.tags)
    ? entry.tags.map((tag) => tag.trim()).filter(Boolean)
    : [];

  return {
    ...entry,
    tags,
    dateISO:
      entry.dateISO || (entry.date ? parseLongDateToIso(entry.date) : formatTodayIso()),
  };
}

function loadEntries() {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored).map(normalizeEntry) : [];
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

function applyTheme(theme) {
  const isDark = theme === "dark";
  document.body.classList.toggle("dark-mode", isDark);
  document.documentElement.classList.toggle("dark-mode", isDark);
  themeToggle.textContent = isDark ? "Light mode" : "Dark mode";
}

function loadTheme() {
  return localStorage.getItem(THEME_KEY) || "light";
}

function saveTheme(theme) {
  localStorage.setItem(THEME_KEY, theme);
  applyTheme(theme);
}

function toggleTheme() {
  const currentTheme = document.body.classList.contains("dark-mode") ? "dark" : "light";
  const nextTheme = currentTheme === "dark" ? "light" : "dark";
  console.log(`toggleTheme: currentTheme=${currentTheme}, nextTheme=${nextTheme}`);
  saveTheme(nextTheme);
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
      selectedTag === "" || entry.tags.includes(selectedTag);
    return matchesText && matchesTag;
  });
}

function formatExportDate(entry) {
  if (entry.dateISO) {
    return entry.dateISO;
  }

  if (entry.date) {
    return parseLongDateToIso(entry.date);
  }

  return "";
}

function buildExportText(entries) {
  return entries
    .map((entry) => {
      const tagsLine = entry.tags && entry.tags.length ? entry.tags.join(", ") : "none";
      const exportDate = formatExportDate(entry);
      return `Date: ${exportDate}\nTitle: ${entry.title}\nTags: ${tagsLine}\n\n${entry.text}\n\n${"-".repeat(40)}\n`;
    })
    .join("\n");
}

function exportEntries() {
  const entries = loadEntries();
  const content = buildExportText(entries);
  const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");

  link.href = url;
  link.download = `journal-entries-${new Date().toISOString().slice(0, 10)}.txt`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
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
  const tagsHtml = entry.tags.length
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

  li.querySelector(".btn-edit").addEventListener("click", () => startEditingEntry(entry.id));
  li.querySelector(".btn-delete").addEventListener("click", () => deleteEntry(entry.id));

  return li;
}

function renderEmptyState(message) {
  entriesList.innerHTML = "";
  emptyState.textContent = message;
  emptyState.classList.remove("hidden");
}

function populateEntries(visibleEntries) {
  entriesList.innerHTML = "";
  visibleEntries.forEach((entry) => {
    const card = renderEntry(entry);
    card.classList.add("fade-in");
    entriesList.appendChild(card);
  });

  requestAnimationFrame(() => {
    entriesList.querySelectorAll(".entry-card.fade-in").forEach((card) => {
      card.classList.remove("fade-in");
    });
  });
}

function fadeOutCurrentCards(callback) {
  const currentCards = Array.from(entriesList.querySelectorAll(".entry-card"));
  if (!currentCards.length) {
    callback();
    return;
  }

  let completed = 0;
  const finish = () => {
    completed += 1;
    if (completed >= currentCards.length) callback();
  };

  currentCards.forEach((card) => {
    card.addEventListener(
      "transitionend",
      (event) => {
        if (event.propertyName === "opacity") {
          finish();
        }
      },
      { once: true }
    );
    card.classList.add("fade-out");
  });

  setTimeout(() => {
    if (completed < currentCards.length) callback();
  }, 280);
}

function renderEntries() {
  const entries = loadEntries();
  const visibleEntries = filterEntries(entries);

  updateTagFilterOptions(entries);

  if (!entries.length) {
    renderEmptyState("No entries yet. Write your first one above.");
    return;
  }

  if (!visibleEntries.length) {
    renderEmptyState("No entries match your search or tag filter.");
    return;
  }

  emptyState.classList.add("hidden");
  fadeOutCurrentCards(() => populateEntries(visibleEntries));
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
    dateISO: formatTodayIso(),
  };

  entries.unshift(entry);
  saveEntries(entries);
  renderEntries();

  form.reset();
  titleInput.focus();
});

searchInput.addEventListener("input", renderEntries);
tagFilter.addEventListener("change", renderEntries);
exportButton.addEventListener("click", exportEntries);
themeToggle.addEventListener("click", toggleTheme);

saveTheme(loadTheme());
renderEntries();
cancelEditing();
