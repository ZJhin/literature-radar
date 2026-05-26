(async function () {
  const storagePrefix = "so-lit-radar:";

  await loadWeeklyData();
  const weeks = window.LITERATURE_WEEKS || [];

  const state = {
    weekId: weeks[0]?.id || "",
    search: "",
    type: "all",
    status: "all",
    tags: new Set(),
    sort: "relevance",
    selectedId: ""
  };

  const els = {
    weekSelect: document.getElementById("weekSelect"),
    searchInput: document.getElementById("searchInput"),
    typeSelect: document.getElementById("typeSelect"),
    statusSelect: document.getElementById("statusSelect"),
    tagFilters: document.getElementById("tagFilters"),
    briefDate: document.getElementById("briefDate"),
    briefTitle: document.getElementById("briefTitle"),
    briefSummary: document.getElementById("briefSummary"),
    paperCount: document.getElementById("paperCount"),
    readFirstCount: document.getElementById("readFirstCount"),
    preprintCount: document.getElementById("preprintCount"),
    paperList: document.getElementById("paperList"),
    detailEmpty: document.getElementById("detailEmpty"),
    paperDetail: document.getElementById("paperDetail"),
    detailPriority: document.getElementById("detailPriority"),
    detailStatus: document.getElementById("detailStatus"),
    detailTitle: document.getElementById("detailTitle"),
    detailCitation: document.getElementById("detailCitation"),
    detailTags: document.getElementById("detailTags"),
    detailDate: document.getElementById("detailDate"),
    detailType: document.getElementById("detailType"),
    detailRelevance: document.getElementById("detailRelevance"),
    detailSummary: document.getElementById("detailSummary"),
    detailWhy: document.getElementById("detailWhy"),
    detailCaveats: document.getElementById("detailCaveats"),
    detailNotes: document.getElementById("detailNotes"),
    doiLink: document.getElementById("doiLink"),
    sourceLink: document.getElementById("sourceLink"),
    copyCitationButton: document.getElementById("copyCitationButton"),
    exportButton: document.getElementById("exportButton")
  };

  function loadWeeklyData() {
    const sources = window.LITERATURE_MANIFEST?.weeks || [];
    const loaded = new Set(Array.from(document.scripts).map((script) => script.getAttribute("src")));

    return sources.reduce((chain, source) => (
      chain.then(() => {
        if (loaded.has(source)) return Promise.resolve();

        return new Promise((resolve, reject) => {
          const script = document.createElement("script");
          script.src = source;
          script.onload = resolve;
          script.onerror = () => reject(new Error(`Could not load ${source}`));
          document.body.appendChild(script);
        });
      })
    ), Promise.resolve());
  }

  function currentWeek() {
    return weeks.find((week) => week.id === state.weekId) || weeks[0];
  }

  function paperKey(id) {
    return `${storagePrefix}${id}`;
  }

  function loadPaperState(id) {
    try {
      return JSON.parse(localStorage.getItem(paperKey(id))) || {};
    } catch (_error) {
      return {};
    }
  }

  function savePaperState(id, patch) {
    const next = { ...loadPaperState(id), ...patch };
    localStorage.setItem(paperKey(id), JSON.stringify(next));
  }

  function enrichPaper(paper) {
    const saved = loadPaperState(paper.id);
    return {
      ...paper,
      reading_status: saved.reading_status || paper.reading_status || "to_read",
      notes: saved.notes || paper.notes || ""
    };
  }

  function priorityLabel(value) {
    return {
      read_first: "Read first",
      track: "Track",
      background: "Background",
      low: "Low"
    }[value] || "Track";
  }

  function statusLabel(value) {
    return {
      to_read: "To read",
      reading: "Reading",
      done: "Done",
      ignore: "Ignore"
    }[value] || "To read";
  }

  function normalize(value) {
    return String(value || "").toLowerCase();
  }

  function allPapers() {
    return (currentWeek()?.papers || []).map(enrichPaper);
  }

  function filteredPapers() {
    const query = normalize(state.search);
    const selectedTags = Array.from(state.tags);

    const result = allPapers().filter((paper) => {
      const haystack = normalize([
        paper.title,
        paper.authors?.join(" "),
        paper.source,
        paper.doi,
        paper.tags?.join(" "),
        paper.summary,
        paper.why_it_matters
      ].join(" "));

      const matchesQuery = !query || haystack.includes(query);
      const matchesType = state.type === "all" || paper.paper_type === state.type;
      const matchesStatus = state.status === "all" || paper.reading_status === state.status;
      const matchesTags = selectedTags.length === 0 || selectedTags.every((tag) => paper.tags.includes(tag));
      return matchesQuery && matchesType && matchesStatus && matchesTags;
    });

    return result.sort((a, b) => {
      if (state.sort === "date") {
        return new Date(b.published_date) - new Date(a.published_date);
      }
      if (state.sort === "priority") {
        const rank = { read_first: 0, track: 1, background: 2, low: 3 };
        return (rank[a.priority] ?? 9) - (rank[b.priority] ?? 9);
      }
      return (b.relevance_score || 0) - (a.relevance_score || 0);
    });
  }

  function renderControls() {
    els.weekSelect.innerHTML = weeks.map((week) => (
      `<option value="${week.id}">${week.date}</option>`
    )).join("");
    els.weekSelect.value = state.weekId;

    const papers = allPapers();
    const types = Array.from(new Set(papers.map((paper) => paper.paper_type))).sort();
    els.typeSelect.innerHTML = `<option value="all">All types</option>${types.map((type) => (
      `<option value="${type}">${type}</option>`
    )).join("")}`;
    els.typeSelect.value = state.type;

    const tags = Array.from(new Set(papers.flatMap((paper) => paper.tags))).sort();
    els.tagFilters.innerHTML = tags.map((tag) => {
      const active = state.tags.has(tag) ? " is-active" : "";
      return `<button class="tag-chip${active}" data-tag="${tag}" type="button">${tag}</button>`;
    }).join("");
  }

  function renderBrief() {
    const week = currentWeek();
    const papers = allPapers();

    els.briefDate.textContent = week?.date || "";
    els.briefTitle.textContent = week?.title || "No weekly brief";
    els.briefSummary.textContent = week?.synthesis || "";
    els.paperCount.textContent = papers.length;
    els.readFirstCount.textContent = papers.filter((paper) => paper.priority === "read_first").length;
    els.preprintCount.textContent = papers.filter((paper) => paper.paper_type === "preprint").length;
  }

  function renderList() {
    const papers = filteredPapers();

    if (!papers.length) {
      els.paperList.innerHTML = `<div class="empty-list">No matching papers</div>`;
      renderDetail(null);
      return;
    }

    if (!papers.some((paper) => paper.id === state.selectedId)) {
      state.selectedId = papers[0].id;
    }

    els.paperList.innerHTML = papers.map((paper) => {
      const selected = paper.id === state.selectedId ? " is-selected" : "";
      const tags = paper.tags.slice(0, 5).map((tag) => `<span class="tag-chip">${tag}</span>`).join("");
      return `
        <button class="paper-card${selected}" data-paper-id="${paper.id}" type="button">
          <header>
            <h3>${escapeHtml(paper.title)}</h3>
            <span class="priority-pill ${paper.priority}">${priorityLabel(paper.priority)}</span>
          </header>
          <p>${escapeHtml(paper.summary)}</p>
          <div class="card-meta">
            <span>${escapeHtml(paper.source)}</span>
            <span>${escapeHtml(paper.published_date)}</span>
            <span>${Math.round((paper.relevance_score || 0) * 100)}%</span>
            <span class="status-pill">${statusLabel(paper.reading_status)}</span>
          </div>
          <div class="tag-row">${tags}</div>
        </button>
      `;
    }).join("");

    renderDetail(papers.find((paper) => paper.id === state.selectedId));
  }

  function renderDetail(paper) {
    if (!paper) {
      els.detailEmpty.hidden = false;
      els.paperDetail.hidden = true;
      return;
    }

    els.detailEmpty.hidden = true;
    els.paperDetail.hidden = false;
    els.detailPriority.className = `priority-pill ${paper.priority}`;
    els.detailPriority.textContent = priorityLabel(paper.priority);
    els.detailStatus.value = paper.reading_status;
    els.detailTitle.textContent = paper.title;
    els.detailCitation.textContent = formatCitation(paper);
    els.detailTags.innerHTML = paper.tags.map((tag) => `<span class="tag-chip">${tag}</span>`).join("");
    els.detailDate.textContent = paper.published_date;
    els.detailType.textContent = paper.paper_type;
    els.detailRelevance.textContent = `${Math.round((paper.relevance_score || 0) * 100)}%`;
    els.detailSummary.textContent = paper.summary;
    els.detailWhy.textContent = paper.why_it_matters;
    els.detailCaveats.textContent = paper.caveats || "None noted.";
    els.detailNotes.value = paper.notes || "";

    els.doiLink.href = paper.doi ? `https://doi.org/${paper.doi}` : paper.url || "#";
    els.doiLink.toggleAttribute("hidden", !paper.doi);
    els.sourceLink.href = paper.url || (paper.doi ? `https://doi.org/${paper.doi}` : "#");
    els.sourceLink.toggleAttribute("hidden", !paper.url && !paper.doi);
  }

  function escapeHtml(value) {
    return String(value || "")
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

  function exportFiltered() {
    const payload = JSON.stringify(filteredPapers(), null, 2);
    const blob = new Blob([payload], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${state.weekId || "literature"}-filtered.json`;
    link.click();
    URL.revokeObjectURL(url);
  }

  function bindEvents() {
    els.weekSelect.addEventListener("change", (event) => {
      state.weekId = event.target.value;
      state.type = "all";
      state.tags.clear();
      state.selectedId = "";
      render();
    });

    els.searchInput.addEventListener("input", (event) => {
      state.search = event.target.value;
      renderList();
    });

    els.typeSelect.addEventListener("change", (event) => {
      state.type = event.target.value;
      state.selectedId = "";
      renderList();
    });

    els.statusSelect.addEventListener("change", (event) => {
      state.status = event.target.value;
      state.selectedId = "";
      renderList();
    });

    els.tagFilters.addEventListener("click", (event) => {
      const button = event.target.closest("[data-tag]");
      if (!button) return;
      const tag = button.dataset.tag;
      state.tags.has(tag) ? state.tags.delete(tag) : state.tags.add(tag);
      state.selectedId = "";
      renderControls();
      renderList();
    });

    document.querySelectorAll(".sort-button").forEach((button) => {
      button.addEventListener("click", () => {
        state.sort = button.dataset.sort;
        document.querySelectorAll(".sort-button").forEach((item) => item.classList.remove("is-active"));
        button.classList.add("is-active");
        renderList();
      });
    });

    els.paperList.addEventListener("click", (event) => {
      const card = event.target.closest("[data-paper-id]");
      if (!card) return;
      state.selectedId = card.dataset.paperId;
      renderList();
    });

    els.detailStatus.addEventListener("change", (event) => {
      if (!state.selectedId) return;
      savePaperState(state.selectedId, { reading_status: event.target.value });
      renderList();
    });

    els.detailNotes.addEventListener("input", (event) => {
      if (!state.selectedId) return;
      savePaperState(state.selectedId, { notes: event.target.value });
    });

    els.copyCitationButton.addEventListener("click", async () => {
      const paper = allPapers().find((item) => item.id === state.selectedId);
      if (!paper) return;
      try {
      await navigator.clipboard.writeText(formatCitation(paper));
      } catch (_error) {
        const textarea = document.createElement("textarea");
        textarea.value = formatCitation(paper);
        textarea.style.position = "fixed";
        textarea.style.opacity = "0";
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand("copy");
        textarea.remove();
      }
      els.copyCitationButton.textContent = "Copied";
      window.setTimeout(() => {
        els.copyCitationButton.textContent = "Copy Citation";
      }, 1200);
    });

    els.exportButton.addEventListener("click", exportFiltered);
  }

  function render() {
    renderControls();
    renderBrief();
    renderList();
  }

  function formatCitation(paper) {
    if (paper.citation) return paper.citation;

    const authorText = paper.authors?.length ? paper.authors.join(", ") : "Unknown authors";
    const sourceText = paper.source ? ` ${paper.source}.` : "";
    const doiText = paper.doi ? ` https://doi.org/${paper.doi}` : paper.url ? ` ${paper.url}` : "";
    return `${authorText} (${paper.year || "n.d."}). ${paper.title}.${sourceText}${doiText}`;
  }

  bindEvents();
  render();
})();
