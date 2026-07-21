const form = document.getElementById("journal-form");
const titleInput = document.getElementById("entry-title");
const textInput = document.getElementById("entry-text");
const entriesList = document.getElementById("entries-list");
const emptyState = document.getElementById("empty-state");

const STORAGE_KEY = "journal-entries";

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

function renderEntry(entry) {
  const li = document.createElement("li");
  li.className = "entry-card";
  li.innerHTML = `
    <p class="entry-date">${entry.date}</p>
    <h3 class="entry-title">${escapeHtml(entry.title)}</h3>
    <p class="entry-text">${escapeHtml(entry.text)}</p>
  `;
  return li;
}

function escapeHtml(str) {
  const div = document.createElement("div");
  div.textContent = str;
  return div.innerHTML;
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
    entriesList.prepend(renderEntry(entry));
  });
}

form.addEventListener("submit", (event) => {
  event.preventDefault();

  const title = titleInput.value.trim();
  const text = textInput.value.trim();

  if (!title || !text) return;

  const entry = {
    id: Date.now(),
    title,
    text,
    date: formatTodayDate(),
  };

  const entries = loadEntries();
  entries.unshift(entry);
  saveEntries(entries);

  entriesList.prepend(renderEntry(entry));
  emptyState.classList.add("hidden");

  form.reset();
  titleInput.focus();
});

renderEntries();
