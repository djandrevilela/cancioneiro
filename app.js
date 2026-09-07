(function () {
  "use strict";

  const listEl = document.getElementById("list");
  const tabsEl = document.getElementById("tabs");
  const searchEl = document.getElementById("search");
  const emptyStateEl = document.getElementById("emptyState");
  const controlsEl = document.querySelector(".controls");

  const detailView = document.getElementById("detailView");
  const detailTitle = document.getElementById("detailTitle");
  const detailAuthor = document.getElementById("detailAuthor");
  const detailCategory = document.getElementById("detailCategory");
  const detailContent = document.getElementById("detailContent");
  const listenBtn = document.getElementById("listenBtn");
  const backBtn = document.getElementById("backBtn");
  const viewTabButtons = document.querySelectorAll(".view-tab");

  const ALL_CATEGORY = "Todas";

  // Fixed palette so the usual categories always look the same; unknown
  // categories added later by the user get a stable color generated from
  // their name (see hashColor below).
  const CATEGORY_COLORS = {
    "Entrada": "#1F7A5C",
    "Inicial": "#2E8F6B",
    "Ato Penitencial": "#6B4C57",
    "Aspersão": "#2F8FA0",
    "Glória": "#C9922E",
    "Salmo": "#3E6B4F",
    "Aclamação": "#B15E1F",
    "Ofertório": "#2E7D8C",
    "Apresentação dos dons": "#4F8C3D",
    "Santo": "#9C3B6B",
    "Comunhão": "#3F5B9E",
    "Pós Comunhão": "#5A6B8C",
    "Ação de Graças": "#8C6D1F",
    "Final": "#B0473E",
    "Reflexão": "#4A5FA8",
    "Louvor": "#D97F1F",
    "Adoração": "#A63D9D",
    "Baptismo": "#3D8C7A",
    "Crisma": "#A0522D",
    "Benção das Alianças": "#C2185B"
  };

  let songs = [];
  let activeCategory = ALL_CATEGORY;
  let searchTerm = "";
  let currentSong = null;
  let currentDetailView = "lyrics";

  // A song can use "categories": ["Entrada", "Final"] (array, any number of
  // categories) or the older single "category": "Entrada" (string) — both
  // work, and this is the one place that reads them.
  function getSongCategories(song) {
    if (Array.isArray(song.categories)) return song.categories.filter(Boolean);
    if (song.category) return [song.category];
    return [];
  }

  function normalize(str) {
    return (str || "")
      .toString()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase();
  }

  function hashColor(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      hash = str.charCodeAt(i) + ((hash << 5) - hash);
    }
    const hue = Math.abs(hash) % 360;
    return `hsl(${hue} 38% 32%)`;
  }

  function categoryColor(cat) {
    if (!cat) return "#8A7F71";
    return CATEGORY_COLORS[cat] || hashColor(cat);
  }

  function hexToRgba(hex, alpha) {
    if (!hex.startsWith("#")) return hex; // already hsl(), can't tint easily
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  }

  function stylePill(el, cat) {
    const color = categoryColor(cat);
    el.textContent = cat || "";
    el.style.color = color;
    el.style.background = color.startsWith("#") ? hexToRgba(color, 0.14) : "rgba(0,0,0,0.06)";
  }

  function measureControlsHeight() {
    if (controlsEl) {
      document.documentElement.style.setProperty("--controls-h", controlsEl.offsetHeight + "px");
    }
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
        measureControlsHeight();
      })
      .catch((err) => {
        listEl.innerHTML =
          '<p class="empty-state">Não foi possível carregar o repositório. Verifique se o ficheiro songs.json existe e se a página está a ser servida por um servidor web (não aberta diretamente do disco).</p>';
        console.error(err);
      });
  }

  function buildTabs() {
    const categories = Array.from(
      new Set(songs.flatMap(getSongCategories))
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
      .filter((s) => activeCategory === ALL_CATEGORY || getSongCategories(s).includes(activeCategory))
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
    let currentGrid = null;

    filtered.forEach((song) => {
      const firstChar = normalize(song.title).charAt(0).toUpperCase();
      if (firstChar !== lastLetter) {
        lastLetter = firstChar;
        const heading = document.createElement("div");
        heading.className = "letter-heading";
        heading.textContent = firstChar;
        listEl.appendChild(heading);

        currentGrid = document.createElement("div");
        currentGrid.className = "song-grid";
        listEl.appendChild(currentGrid);
      }

      const cats = getSongCategories(song);

      const card = document.createElement("button");
      card.className = "song-card";
      if (cats.length) {
        const accent = categoryColor(cats[0]);
        if (accent.startsWith("#")) card.style.setProperty("--card-accent", accent);
      }

      const pillsRow = document.createElement("span");
      pillsRow.className = "pills-row";
      cats.forEach((cat) => {
        const pill = document.createElement("span");
        pill.className = "cat-pill";
        stylePill(pill, cat);
        pillsRow.appendChild(pill);
      });

      const titleEl = document.createElement("span");
      titleEl.className = "song-title";
      titleEl.textContent = song.title;

      const authorEl = document.createElement("span");
      authorEl.className = "song-author";
      authorEl.textContent = song.author || "";

      if (pillsRow.children.length) card.appendChild(pillsRow);
      card.appendChild(titleEl);
      card.appendChild(authorEl);
      card.addEventListener("click", () => openSong(song));
      currentGrid.appendChild(card);
    });
  }

  function openSong(song) {
    currentSong = song;
    currentDetailView = "lyrics";
    detailTitle.textContent = song.title;
    detailAuthor.textContent = song.author || "";
    detailCategory.innerHTML = "";
    const cats = getSongCategories(song);
    if (cats.length) {
      detailCategory.classList.remove("hidden");
      cats.forEach((cat) => {
        const pill = document.createElement("span");
        pill.className = "cat-pill";
        stylePill(pill, cat);
        detailCategory.appendChild(pill);
      });
    } else {
      detailCategory.classList.add("hidden");
    }
    viewTabButtons.forEach((btn) =>
      btn.classList.toggle("active", btn.dataset.view === "lyrics")
    );

    const listenUrl = song.listenUrl || song.sourceUrl || "";
    if (listenUrl) {
      listenBtn.href = listenUrl;
      listenBtn.classList.remove("hidden");
    } else {
      listenBtn.removeAttribute("href");
      listenBtn.classList.add("hidden");
    }

    renderDetailContent();
    detailView.classList.add("open");
    detailView.setAttribute("aria-hidden", "false");
    detailView.scrollTop = 0;
  }

  function closeSong() {
    detailView.classList.remove("open");
    detailView.setAttribute("aria-hidden", "true");
  }

  function renderDetailContent() {
    if (!currentSong) return;
    detailContent.classList.remove("lyrics-view", "mono-view", "sheet-view");
    detailContent.innerHTML = "";

    if (currentDetailView === "piano") {
      detailContent.classList.add("sheet-view");
      const abcSource = (currentSong.piano || "").trim();

      if (!abcSource) {
        detailContent.innerHTML = '<p class="sheet-fallback">Ainda não há partitura para esta música.</p>';
        return;
      }
      if (!window.ABCJS) {
        detailContent.innerHTML = '<p class="sheet-fallback">A partitura precisa de ligação à internet para ser desenhada.</p>';
        return;
      }
      try {
        window.ABCJS.renderAbc(detailContent, abcSource, {
          responsive: "resize",
          staffwidth: 540,
          paddingtop: 10,
          paddingbottom: 10,
          paddingleft: 8,
          paddingright: 8,
          foregroundColor: "#2B2420",
          format: {
            titlefont: '"Lora" 17',
            gchordfont: '"IBM Plex Sans" 14 bold',
            tempofont: '"IBM Plex Sans" 12',
            partsfont: '"IBM Plex Sans" 12'
          }
        });
      } catch (e) {
        detailContent.innerHTML = '<p class="sheet-fallback">Não foi possível desenhar a partitura.</p>';
        console.error(e);
      }
      return;
    }

    const value = currentSong[currentDetailView] || "(sem conteúdo)";
    detailContent.textContent = value;
    detailContent.classList.add(currentDetailView === "lyrics" ? "lyrics-view" : "mono-view");
  }

  viewTabButtons.forEach((btn) => {
    btn.addEventListener("click", () => {
      currentDetailView = btn.dataset.view;
      viewTabButtons.forEach((b) => b.classList.toggle("active", b === btn));
      renderDetailContent();
    });
  });

  backBtn.addEventListener("click", closeSong);

  searchEl.addEventListener("input", (e) => {
    searchTerm = e.target.value;
    renderList();
  });

  window.addEventListener("resize", measureControlsHeight);

  loadSongs();
})();
