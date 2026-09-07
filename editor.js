(function () {
  "use strict";

  // ---------------------------------------------------------------------
  // Elements
  // ---------------------------------------------------------------------
  const el = (id) => document.getElementById(id);

  const githubToggle = el("githubToggle");
  const githubBody = el("githubBody");
  const githubStatusDot = el("githubStatusDot");
  const githubStatusText = el("githubStatusText");
  const githubMessage = el("githubMessage");

  const ghRepo = el("ghRepo");
  const ghBranch = el("ghBranch");
  const ghPath = el("ghPath");
  const ghToken = el("ghToken");
  const ghConnectBtn = el("ghConnectBtn");
  const ghForgetBtn = el("ghForgetBtn");

  const pickerSearch = el("pickerSearch");
  const pickerList = el("pickerList");
  const newSongBtn = el("newSongBtn");

  const fTitle = el("fTitle");
  const fAuthor = el("fAuthor");
  const fCategories = el("fCategories");
  const fListenUrl = el("fListenUrl");
  const fSourceUrl = el("fSourceUrl");
  const fSourceNote = el("fSourceNote");
  const fLyrics = el("fLyrics");
  const fChords = el("fChords");

  const pKey = el("pKey");
  const pMeter = el("pMeter");
  const pTempo = el("pTempo");
  const pNotesInput = el("pNotesInput");
  const pAbcOutput = el("pAbcOutput");
  const pianoPreview = el("pianoPreview");
  const convertNotesBtn = el("convertNotesBtn");
  const renderPreviewBtn = el("renderPreviewBtn");

  const saveGithubBtn = el("saveGithubBtn");
  const saveDraftBtn = el("saveDraftBtn");
  const downloadBtn = el("downloadBtn");
  const deleteBtn = el("deleteBtn");
  const formMessage = el("formMessage");

  const LS_SETTINGS = "cancioneiro-editor:github-settings";
  const LS_DRAFT = "cancioneiro-editor:draft-songs";

  let songs = [];        // in-memory working copy
  let currentSha = null; // GitHub file sha, needed to commit an update
  let editingId = null;  // id of the song currently loaded in the form, or null for "new"

  // ---------------------------------------------------------------------
  // Portuguese solfège ⇄ ABC notation conversion
  // ---------------------------------------------------------------------
  const NOTE_MAP = { do: "C", re: "D", mi: "E", fa: "F", sol: "G", la: "A", si: "B" };

  function stripAccents(s) {
    return s.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  }

  function convertKeyName(input) {
    if (!input || !input.trim()) return "C";
    const raw = input.trim();
    const minor = /menor|m\s*$/i.test(raw);
    let base = raw.replace(/menor/i, "").replace(/m\s*$/i, "").trim();
    let acc = "";
    if (/#/.test(base)) {
      acc = "#";
      base = base.replace("#", "");
    } else if (/b\s*$/i.test(base) && base.length > 1) {
      acc = "b";
      base = base.replace(/b\s*$/i, "");
    }
    const norm = stripAccents(base.toLowerCase()).trim();
    const letter = NOTE_MAP[norm] || "C";
    return letter + acc + (minor ? "m" : "");
  }

  // Converts a single note token like "Fá#4", "sol2", "Ré" into ABC:
  // uppercase Portuguese name -> uppercase ABC letter (this octave)
  // lowercase Portuguese name -> lowercase ABC letter (octave up)
  // trailing # / b -> ABC accidental prefix (^ / _)
  // trailing digits (duration) pass through unchanged
  function convertNoteToken(raw) {
    const m = raw.match(/^([A-Za-zÀ-ÿ]+)([#b]?)(\d*)$/);
    if (!m) return raw;
    const [, name, acc, dur] = m;
    const norm = stripAccents(name.toLowerCase());
    const letter = NOTE_MAP[norm];
    if (!letter) return raw; // not a recognised note name — leave untouched
    const isUpper = name[0] === name[0].toUpperCase();
    const abcLetter = isUpper ? letter : letter.toLowerCase();
    const prefix = acc === "#" ? "^" : acc === "b" ? "_" : "";
    return prefix + abcLetter + dur;
  }

  function convertNotesBodyToAbc(body) {
    // Protect quoted chord-symbol strings (e.g. "D", "Sol-") from conversion.
    const quoted = [];
    let text = body.replace(/"([^"]*)"/g, (m) => {
      quoted.push(m);
      return `@@Q${quoted.length - 1}@@`;
    });

    text = text.replace(
      /\b(do|dó|re|ré|mi|fa|fá|sol|la|lá|si)([#b]?)(\d*)\b/gi,
      (m) => convertNoteToken(m)
    );

    text = text.replace(/@@Q(\d+)@@/g, (_, i) => quoted[Number(i)]);
    return text;
  }

  function buildAbcFromSimplifiedNotes() {
    const key = convertKeyName(pKey.value);
    const meter = (pMeter.value || "4/4").trim();
    const tempo = pTempo.value.trim();
    const title = fTitle.value.trim();
    const body = convertNotesBodyToAbc(pNotesInput.value.trim());

    let abc = "X:1\n";
    if (title) abc += `T:${title}\n`;
    abc += `M:${meter}\n`;
    abc += "L:1/4\n";
    if (tempo) abc += `Q:1/4=${tempo}\n`;
    abc += `K:${key}\n`;
    abc += body || '"C" C2 E2 | "G" G2 E2 | "F" F2 E2 | "C" C4 |]';
    return abc;
  }

  function renderPianoPreview() {
    pianoPreview.innerHTML = "";
    const abc = pAbcOutput.value.trim();
    if (!abc) return;
    if (!window.ABCJS) {
      pianoPreview.textContent = "A biblioteca de partitura (abcjs) ainda não carregou — tenta de novo em instantes.";
      return;
    }
    try {
      window.ABCJS.renderAbc(pianoPreview, abc, {
        responsive: "resize",
        staffwidth: 540,
        paddingtop: 8,
        paddingbottom: 8,
        paddingleft: 6,
        paddingright: 6,
        foregroundColor: "#2B2420"
      });
    } catch (e) {
      pianoPreview.textContent = "Não foi possível desenhar esta notação ABC — revê a sintaxe.";
      console.error(e);
    }
  }

  convertNotesBtn.addEventListener("click", () => {
    pAbcOutput.value = buildAbcFromSimplifiedNotes();
    renderPianoPreview();
  });
  renderPreviewBtn.addEventListener("click", renderPianoPreview);

  // ---------------------------------------------------------------------
  // Slug / id generation
  // ---------------------------------------------------------------------
  function slugify(title) {
    return stripAccents(title.toLowerCase())
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");
  }

  function uniqueId(title, excludeId) {
    const base = slugify(title) || "musica";
    let id = base;
    let i = 2;
    const taken = new Set(songs.map((s) => s.id).filter((id2) => id2 !== excludeId));
    while (taken.has(id)) {
      id = `${base}-${i}`;
      i++;
    }
    return id;
  }

  // ---------------------------------------------------------------------
  // GitHub panel
  // ---------------------------------------------------------------------
  githubToggle.addEventListener("click", () => {
    const expanded = githubToggle.getAttribute("aria-expanded") === "true";
    githubToggle.setAttribute("aria-expanded", String(!expanded));
    githubBody.classList.toggle("hidden", expanded);
  });

  function loadGithubSettings() {
    try {
      const raw = localStorage.getItem(LS_SETTINGS);
      if (!raw) return;
      const s = JSON.parse(raw);
      ghRepo.value = s.repo || "";
      ghBranch.value = s.branch || "main";
      ghPath.value = s.path || "songs.json";
      ghToken.value = s.token || "";
    } catch (e) {
      console.error(e);
    }
  }

  function saveGithubSettings() {
    localStorage.setItem(
      LS_SETTINGS,
      JSON.stringify({
        repo: ghRepo.value.trim(),
        branch: ghBranch.value.trim() || "main",
        path: ghPath.value.trim() || "songs.json",
        token: ghToken.value.trim()
      })
    );
  }

  ghForgetBtn.addEventListener("click", () => {
    localStorage.removeItem(LS_SETTINGS);
    ghRepo.value = "";
    ghBranch.value = "main";
    ghPath.value = "songs.json";
    ghToken.value = "";
    setGithubStatus(false, "Ligar ao GitHub");
    showMessage(githubMessage, "Dados esquecidos neste navegador.", "success");
  });

  function setGithubStatus(online, text) {
    githubStatusDot.classList.toggle("online", online);
    githubStatusDot.classList.toggle("offline", !online);
    githubStatusText.textContent = text;
  }

  function showMessage(node, text, kind) {
    node.textContent = text;
    node.classList.remove("hidden", "success", "error");
    node.classList.add(kind);
  }

  // Base64 helpers that are safe for UTF-8 (accented Portuguese text).
  function utf8ToBase64(str) {
    const bytes = new TextEncoder().encode(str);
    let binary = "";
    bytes.forEach((b) => (binary += String.fromCharCode(b)));
    return btoa(binary);
  }
  function base64ToUtf8(b64) {
    const binary = atob(b64.replace(/\n/g, ""));
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
    return new TextDecoder("utf-8").decode(bytes);
  }

  function githubApiUrl() {
    const [owner, repo] = ghRepo.value.trim().split("/");
    const path = ghPath.value.trim() || "songs.json";
    return `https://api.github.com/repos/${owner}/${repo}/contents/${path}`;
  }

  async function connectAndLoad() {
    if (!ghRepo.value.includes("/")) {
      showMessage(githubMessage, "Indica o repositório no formato dono/nome.", "error");
      return;
    }
    if (!ghToken.value.trim()) {
      showMessage(githubMessage, "Falta o personal access token.", "error");
      return;
    }
    saveGithubSettings();
    ghConnectBtn.disabled = true;
    ghConnectBtn.textContent = "A ligar…";
    try {
      const branch = ghBranch.value.trim() || "main";
      const res = await fetch(`${githubApiUrl()}?ref=${encodeURIComponent(branch)}`, {
        headers: {
          Authorization: `Bearer ${ghToken.value.trim()}`,
          Accept: "application/vnd.github+json"
        }
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(`${res.status} ${res.statusText} — ${body.message || "verifica o repositório, o ramo e o token"}`);
      }
      const data = await res.json();
      currentSha = data.sha;
      const text = base64ToUtf8(data.content);
      const parsed = JSON.parse(text);
      songs = parsed.songs || [];
      renderPickerList();
      setGithubStatus(true, `Ligado — ${ghRepo.value.trim()} (${songs.length} músicas)`);
      showMessage(githubMessage, "songs.json carregado com sucesso.", "success");
    } catch (err) {
      console.error(err);
      setGithubStatus(false, "Ligar ao GitHub");
      showMessage(githubMessage, "Falhou: " + err.message, "error");
    } finally {
      ghConnectBtn.disabled = false;
      ghConnectBtn.textContent = "Ligar e carregar songs.json";
    }
  }
  ghConnectBtn.addEventListener("click", connectAndLoad);

  async function publishToGithub() {
    if (!currentSha) {
      showMessage(formMessage, "Liga-te primeiro ao GitHub (painel no topo) antes de publicar.", "error");
      return;
    }
    saveFormIntoSongs();
    saveGithubBtn.disabled = true;
    saveGithubBtn.textContent = "A publicar…";
    try {
      const content = JSON.stringify({ songs }, null, 2);
      const res = await fetch(githubApiUrl(), {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${ghToken.value.trim()}`,
          Accept: "application/vnd.github+json",
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          message: `Atualiza songs.json via editor (${fTitle.value.trim() || "sem título"})`,
          content: utf8ToBase64(content),
          sha: currentSha,
          branch: ghBranch.value.trim() || "main"
        })
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(`${res.status} ${res.statusText} — ${data.message || "falhou o commit"}`);
      }
      currentSha = data.content ? data.content.sha : currentSha;
      renderPickerList();
      showMessage(formMessage, "Publicado no GitHub com sucesso! O site atualiza em cerca de um minuto.", "success");
    } catch (err) {
      console.error(err);
      showMessage(
        formMessage,
        "Falhou ao publicar: " + err.message + " — usa \"Descarregar songs.json\" como alternativa.",
        "error"
      );
    } finally {
      saveGithubBtn.disabled = false;
      saveGithubBtn.textContent = "Publicar no GitHub";
    }
  }
  saveGithubBtn.addEventListener("click", publishToGithub);

  // ---------------------------------------------------------------------
  // Song picker (list + search)
  // ---------------------------------------------------------------------
  function renderPickerList() {
    const term = pickerSearch.value.trim().toLowerCase();
    pickerList.innerHTML = "";
    songs
      .slice()
      .sort((a, b) => a.title.localeCompare(b.title, "pt"))
      .filter((s) => !term || s.title.toLowerCase().includes(term))
      .forEach((song) => {
        const li = document.createElement("li");
        li.className = "picker-item" + (song.id === editingId ? " active" : "");
        li.innerHTML = `${escapeHtml(song.title)}<span class="picker-author">${escapeHtml(song.author || "")}</span>`;
        li.addEventListener("click", () => loadSongIntoForm(song.id));
        pickerList.appendChild(li);
      });
  }
  pickerSearch.addEventListener("input", renderPickerList);

  function escapeHtml(str) {
    const d = document.createElement("div");
    d.textContent = str;
    return d.innerHTML;
  }

  // ---------------------------------------------------------------------
  // Form: load / save / clear
  // ---------------------------------------------------------------------
  function clearForm() {
    editingId = null;
    fTitle.value = "";
    fAuthor.value = "";
    fCategories.value = "";
    fListenUrl.value = "";
    fSourceUrl.value = "";
    fSourceNote.value = "";
    fLyrics.value = "";
    fChords.value = "";
    pKey.value = "";
    pMeter.value = "4/4";
    pTempo.value = "";
    pNotesInput.value = "";
    pAbcOutput.value = "";
    pianoPreview.innerHTML = "";
    deleteBtn.classList.add("hidden");
    showMessage(formMessage, "Nova música — preenche e publica quando estiver pronta.", "success");
    renderPickerList();
  }
  newSongBtn.addEventListener("click", clearForm);

  function loadSongIntoForm(id) {
    const song = songs.find((s) => s.id === id);
    if (!song) return;
    editingId = id;
    fTitle.value = song.title || "";
    fAuthor.value = song.author || "";
    fCategories.value = (song.categories || []).join(", ");
    fListenUrl.value = song.listenUrl || "";
    fSourceUrl.value = song.sourceUrl || "";
    fSourceNote.value = song.sourceNote || "";
    fLyrics.value = song.lyrics || "";
    fChords.value = song.chords || "";
    pKey.value = "";
    pMeter.value = "4/4";
    pTempo.value = "";
    pNotesInput.value = "";
    pAbcOutput.value = song.piano || "";
    renderPianoPreview();
    deleteBtn.classList.remove("hidden");
    showMessage(formMessage, `A editar "${song.title}".`, "success");
    renderPickerList();
  }

  function saveFormIntoSongs() {
    const title = fTitle.value.trim();
    if (!title) return null;

    const categories = fCategories.value
      .split(",")
      .map((c) => c.trim())
      .filter(Boolean);

    const isNew = !editingId;
    const id = isNew ? uniqueId(title, null) : editingId;

    const song = {
      id,
      title,
      author: fAuthor.value.trim(),
      categories,
      sourceUrl: fSourceUrl.value.trim(),
      sourceNote: fSourceNote.value.trim(),
      listenUrl: fListenUrl.value.trim(),
      lyrics: fLyrics.value,
      chords: fChords.value,
      piano: pAbcOutput.value
    };

    if (isNew) {
      songs.push(song);
      editingId = id;
    } else {
      const idx = songs.findIndex((s) => s.id === editingId);
      if (idx >= 0) songs[idx] = song;
    }
    return song;
  }

  saveDraftBtn.addEventListener("click", () => {
    const song = saveFormIntoSongs();
    if (!song) {
      showMessage(formMessage, "Preenche pelo menos o título.", "error");
      return;
    }
    localStorage.setItem(LS_DRAFT, JSON.stringify({ songs, savedAt: Date.now() }));
    renderPickerList();
    showMessage(formMessage, "Rascunho guardado neste navegador (ainda não publicado no GitHub).", "success");
  });

  downloadBtn.addEventListener("click", () => {
    saveFormIntoSongs();
    const blob = new Blob([JSON.stringify({ songs }, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "songs.json";
    a.click();
    URL.revokeObjectURL(url);
  });

  deleteBtn.addEventListener("click", () => {
    if (!editingId) return;
    const song = songs.find((s) => s.id === editingId);
    if (!song) return;
    if (!confirm(`Apagar "${song.title}"? Isto só tem efeito depois de publicares.`)) return;
    songs = songs.filter((s) => s.id !== editingId);
    clearForm();
  });

  // ---------------------------------------------------------------------
  // Startup: restore settings + offer to resume a local draft
  // ---------------------------------------------------------------------
  loadGithubSettings();
  clearForm();

  const draftRaw = localStorage.getItem(LS_DRAFT);
  if (draftRaw) {
    try {
      const draft = JSON.parse(draftRaw);
      if (draft.songs && draft.songs.length && confirm("Encontrei um rascunho guardado neste navegador. Queres continuar a partir dele?")) {
        songs = draft.songs;
        renderPickerList();
      }
    } catch (e) {
      console.error(e);
    }
  }
})();
