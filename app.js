(function () {
  "use strict";

  const listEl = document.getElementById("list");
  const tabsEl = document.getElementById("tabs");
  const searchEl = document.getElementById("search");
  const emptyStateEl = document.getElementById("emptyState");

  const listView = document.getElementById("listView");
  const detailView = document.getElementById("detailView");
  const detailTitle = document.getElementById("detailTitle");
  const detailAuthor = document.getElementById("detailAuthor");
  const detailContent = document.getElementById("detailContent");
  const backBtn = document.getElementById("backBtn");
  const viewTabButtons = document.querySelectorAll(".view-tab");

  const ALL_CATEGORY = "Todas";

  let songs = [];
  let activeCategory = ALL_CATEGORY;
  let searchTerm = "";
  let currentSong = null;
  let currentDetailView = "lyrics";

  function normalize(str) {
    return (str || "")
      .toString()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase();
  }

  function loadSongs() {
    fetch("songs.json")
      .then((res) => {
        if (!res.ok) throw new Error("Falha ao carregar songs.json");
        return res.json();
      })
      .then((data) => {
        songs = (data.songs || []).slice();
        buildTabs();
        renderList();
      })
      .catch((err) => {
        listEl.innerHTML =
          '<p class="empty-state">Não foi possível carregar o repositório. Verifique se o ficheiro songs.json existe e se a página está a ser servida por um servidor web (não aberta diretamente do disco).</p>';
        console.error(err);
      });
  }

  function buildTabs() {
    const categories = Array.from(
      new Set(songs.map((s) => s.category).filter(Boolean))
    ).sort((a, b) => a.localeCompare(b, "pt"));

    const all = [ALL_CATEGORY, ...categories];
    tabsEl.innerHTML = "";
    all.forEach((cat) => {
      const btn = document.createElement("button");
      btn.className = "tab" + (cat === activeCategory ? " active" : "");
      btn.textContent = cat;
      btn.setAttribute("role", "tab");
      btn.setAttribute("aria-selected", cat === activeCategory ? "true" : "false");
      btn.addEventListener("click", () => {
        activeCategory = cat;
        Array.from(tabsEl.children).forEach((c) => {
          c.classList.toggle("active", c === btn);
          c.setAttribute("aria-selected", c === btn ? "true" : "false");
        });
        renderList();
      });
      tabsEl.appendChild(btn);
    });
  }

  function getFilteredSongs() {
    const term = normalize(searchTerm);
    return songs
      .filter((s) => activeCategory === ALL_CATEGORY || s.category === activeCategory)
      .filter((s) => !term || normalize(s.title).includes(term))
      .sort((a, b) => a.title.localeCompare(b.title, "pt"));
  }

  function renderList() {
    const filtered = getFilteredSongs();
    listEl.innerHTML = "";

    if (filtered.length === 0) {
      emptyStateEl.classList.remove("hidden");
      return;
    }
    emptyStateEl.classList.add("hidden");

    let lastLetter = null;
    filtered.forEach((song) => {
      const firstChar = normalize(song.title).charAt(0).toUpperCase();
      if (firstChar !== lastLetter) {
        lastLetter = firstChar;
        const heading = document.createElement("div");
        heading.className = "letter-heading";
        heading.textContent = firstChar;
        listEl.appendChild(heading);
      }

      const item = document.createElement("button");
      item.className = "song-item";
      item.innerHTML =
        '<span class="song-title"></span>' +
        '<span class="song-meta"></span>';
      item.querySelector(".song-title").textContent = song.title;

      const metaEl = item.querySelector(".song-meta");
      const authorSpan = document.createElement("span");
      authorSpan.textContent = song.author || "";
      metaEl.appendChild(authorSpan);
      if (song.category) {
        const dot = document.createElement("span");
        dot.className = "dot";
        dot.textContent = "·";
        const cat = document.createElement("span");
        cat.className = "cat";
        cat.textContent = song.category;
        metaEl.appendChild(dot);
        metaEl.appendChild(cat);
      }

      item.addEventListener("click", () => openSong(song));
      listEl.appendChild(item);
    });
  }

  function openSong(song) {
    currentSong = song;
    currentDetailView = "lyrics";
    detailTitle.textContent = song.title;
    detailAuthor.textContent = song.author || "";
    viewTabButtons.forEach((btn) =>
      btn.classList.toggle("active", btn.dataset.view === "lyrics")
    );
    renderDetailContent();
    listView.classList.add("hidden");
    detailView.classList.remove("hidden");
    detailView.scrollTop = 0;
  }

  function renderDetailContent() {
    if (!currentSong) return;
    const value = currentSong[currentDetailView] || "(sem conteúdo)";
    detailContent.textContent = value;
    detailContent.classList.toggle("lyrics-view", currentDetailView === "lyrics");
    detailContent.classList.toggle(
      "mono-view",
      currentDetailView === "chords" || currentDetailView === "piano"
    );
  }

  viewTabButtons.forEach((btn) => {
    btn.addEventListener("click", () => {
      currentDetailView = btn.dataset.view;
      viewTabButtons.forEach((b) => b.classList.toggle("active", b === btn));
      renderDetailContent();
    });
  });

  backBtn.addEventListener("click", () => {
    detailView.classList.add("hidden");
    listView.classList.remove("hidden");
  });

  searchEl.addEventListener("input", (e) => {
    searchTerm = e.target.value;
    renderList();
  });

  loadSongs();
})();
