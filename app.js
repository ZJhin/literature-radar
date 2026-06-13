(async function () {
  const storagePrefix = "so-lit-radar:";
  const manualDraftsKey = "so-lit-radar:manual-drafts";

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
    exportButton: document.getElementById("exportButton"),
    addPaperButton: document.getElementById("addPaperButton"),
    manualBackdrop: document.getElementById("manualBackdrop"),
    manualPanel: document.getElementById("manualPanel"),
    manualForm: document.getElementById("manualForm"),
    closeManualButton: document.getElementById("closeManualButton"),
    manualStatus: document.getElementById("manualStatus"),
    manualDraftSelect: document.getElementById("manualDraftSelect"),
    manualMonth: document.getElementById("manualMonth"),
    manualPublishedDate: document.getElementById("manualPublishedDate"),
    manualDoi: document.getElementById("manualDoi"),
    manualUrl: document.getElementById("manualUrl"),
    normalizeLinkButton: document.getElementById("normalizeLinkButton"),
    manualTitle: document.getElementById("manualTitle"),
    manualAuthors: document.getElementById("manualAuthors"),
    manualYear: document.getElementById("manualYear"),
    manualSource: document.getElementById("manualSource"),
    manualPaperType: document.getElementById("manualPaperType"),
    manualPriority: document.getElementById("manualPriority"),
    manualRelevance: document.getElementById("manualRelevance"),
    manualLinkQuality: document.getElementById("manualLinkQuality"),
    manualSummary: document.getElementById("manualSummary"),
    manualWhy: document.getElementById("manualWhy"),
    manualCaveats: document.getElementById("manualCaveats"),
    manualTags: document.getElementById("manualTags"),
    manualOutput: document.getElementById("manualOutput"),
    saveDraftButton: document.getElementById("saveDraftButton"),
    copyRecordButton: document.getElementById("copyRecordButton"),
    downloadJsonButton: document.getElementById("downloadJsonButton"),
    downloadJsButton: document.getElementById("downloadJsButton"),
    deleteDraftButton: document.getElementById("deleteDraftButton"),
    clearManualButton: document.getElementById("clearManualButton")
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

  function loadManualDrafts() {
    try {
      return JSON.parse(localStorage.getItem(manualDraftsKey)) || [];
    } catch (_error) {
      return [];
    }
  }

  function saveManualDrafts(drafts) {
    localStorage.setItem(manualDraftsKey, JSON.stringify(drafts));
  }

  function renderManualDrafts(selectedId = "") {
    const drafts = loadManualDrafts().sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
    els.manualDraftSelect.innerHTML = `<option value="">New draft</option>${drafts.map((draft) => {
      const label = [draft.month, draft.record?.title || "Untitled"].filter(Boolean).join(" - ");
      return `<option value="${escapeHtml(draft.draftId)}">${escapeHtml(label)}</option>`;
    }).join("")}`;
    els.manualDraftSelect.value = selectedId;
  }

  function defaultManualMonth() {
    const weekId = currentWeek()?.id || "";
    if (/^\d{4}-\d{2}$/.test(weekId)) return weekId;
    if (/^\d{4}-\d{2}/.test(weekId)) return weekId.slice(0, 7);
    return new Date().toISOString().slice(0, 7);
  }

  function setManualStatus(message, type = "") {
    els.manualStatus.textContent = message;
    els.manualStatus.className = `manual-status${type ? ` is-${type}` : ""}`;
  }

  function openManualPanel() {
    els.manualBackdrop.hidden = false;
    els.manualPanel.hidden = false;
    renderManualDrafts(els.manualDraftSelect.value);
    if (!els.manualMonth.value) resetManualForm();
    updateManualOutput();
    els.manualDoi.focus();
  }

  function closeManualPanel() {
    els.manualBackdrop.hidden = true;
    els.manualPanel.hidden = true;
  }

  function resetManualForm() {
    els.manualDraftSelect.value = "";
    els.manualMonth.value = defaultManualMonth();
    els.manualPublishedDate.value = "";
    els.manualDoi.value = "";
    els.manualUrl.value = "";
    els.manualTitle.value = "";
    els.manualAuthors.value = "";
    els.manualYear.value = els.manualMonth.value.slice(0, 4);
    els.manualSource.value = "";
    els.manualPaperType.value = "peer-reviewed";
    els.manualPriority.value = "track";
    els.manualRelevance.value = "0.7";
    els.manualLinkQuality.value = "doi";
    els.manualSummary.value = "";
    els.manualWhy.value = "";
    els.manualCaveats.value = "";
    els.manualTags.value = "Southern Ocean, sea ice, carbon uptake";
    setManualStatus("");
    updateManualOutput();
  }

  function loadManualDraft(draftId) {
    const draft = loadManualDrafts().find((item) => item.draftId === draftId);
    if (!draft) {
      resetManualForm();
      return;
    }

    const record = draft.record || {};
    els.manualMonth.value = draft.month || record.published_date?.slice(0, 7) || defaultManualMonth();
    els.manualPublishedDate.value = record.published_date || "";
    els.manualDoi.value = record.doi || "";
    els.manualUrl.value = record.url || "";
    els.manualTitle.value = record.title || "";
    els.manualAuthors.value = (record.authors || []).join("; ");
    els.manualYear.value = record.year || els.manualMonth.value.slice(0, 4);
    els.manualSource.value = record.source || "";
    els.manualPaperType.value = record.paper_type || "peer-reviewed";
    els.manualPriority.value = record.priority || "track";
    els.manualRelevance.value = String(record.relevance_score ?? 0.7);
    els.manualLinkQuality.value = record.link_quality || inferLinkQuality(record);
    els.manualSummary.value = record.summary || "";
    els.manualWhy.value = record.why_it_matters || "";
    els.manualCaveats.value = record.caveats || "";
    els.manualTags.value = (record.tags || []).join(", ");
    setManualStatus("Draft loaded.", "ok");
    updateManualOutput();
  }

  function normalizeManualLinks() {
    const doiFromDoi = extractDoi(els.manualDoi.value);
    const doiFromUrl = extractDoi(els.manualUrl.value);
    const doi = doiFromDoi || doiFromUrl;

    if (doi) {
      els.manualDoi.value = doi;
      if (!els.manualUrl.value || els.manualUrl.value.includes("doi.org")) {
        els.manualUrl.value = `https://doi.org/${doi}`;
      }
      els.manualLinkQuality.value = els.manualPaperType.value === "preprint" ? "preprint" : "doi";
      setManualStatus("DOI normalized.", "ok");
    } else if (els.manualUrl.value) {
      els.manualUrl.value = els.manualUrl.value.trim();
      els.manualLinkQuality.value = inferLinkQuality({ url: els.manualUrl.value, paper_type: els.manualPaperType.value });
      setManualStatus("URL normalized.", "ok");
    } else {
      setManualStatus("Add a DOI or URL first.", "error");
    }

    updateManualOutput();
  }

  function extractDoi(value) {
    const text = String(value || "").trim();
    const match = text.match(/10\.\d{4,9}\/[^\s"<>]+/i);
    if (!match) return "";
    return match[0].replace(/[),.;\]]+$/, "");
  }

  function splitList(value) {
    return String(value || "")
      .split(/\n|;/)
      .map((item) => item.trim())
      .filter(Boolean);
  }

  function splitTags(value) {
    return String(value || "")
      .split(/,|\n|;/)
      .map((item) => item.trim())
      .filter(Boolean);
  }

  function slugify(value) {
    return String(value || "")
      .toLowerCase()
      .replace(/&/g, " and ")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 80);
  }

  function firstAuthorSlug(authors) {
    const first = authors[0] || "unknown";
    const parts = first.trim().split(/\s+/);
    return slugify(parts[parts.length - 1] || first) || "unknown";
  }

  function generatePaperId(record) {
    const titleWords = slugify(record.title).split("-").slice(0, 6).join("-");
    return [firstAuthorSlug(record.authors), record.year || "n-d", titleWords || "paper"].filter(Boolean).join("-");
  }

  function inferLinkQuality(record) {
    const url = String(record.url || "").toLowerCase();
    if (record.doi) return record.paper_type === "preprint" ? "preprint" : "doi";
    if (record.paper_type === "preprint" || url.includes("egusphere") || url.includes("preprint")) return "preprint";
    if (record.paper_type === "news" || url.includes("sciencedaily") || url.includes("phys.org")) return "news_only";
    return "journal_page";
  }

  function manualRecordFromForm() {
    const doi = extractDoi(els.manualDoi.value);
    const authors = splitList(els.manualAuthors.value);
    const month = els.manualMonth.value || defaultManualMonth();
    const publishedDate = els.manualPublishedDate.value || `${month}-01`;
    const year = Number(els.manualYear.value || publishedDate.slice(0, 4) || month.slice(0, 4));
    const relevance = Math.max(0, Math.min(1, Number(els.manualRelevance.value || 0)));
    const record = {
      id: "",
      title: els.manualTitle.value.trim(),
      authors,
      year,
      source: els.manualSource.value.trim(),
      doi,
      url: els.manualUrl.value.trim() || (doi ? `https://doi.org/${doi}` : ""),
      link_quality: els.manualLinkQuality.value,
      published_date: publishedDate,
      paper_type: els.manualPaperType.value,
      priority: els.manualPriority.value,
      summary: els.manualSummary.value.trim(),
      why_it_matters: els.manualWhy.value.trim(),
      caveats: els.manualCaveats.value.trim(),
      tags: splitTags(els.manualTags.value),
      relevance_score: relevance,
      reading_status: "to_read",
      notes: ""
    };

    record.link_quality = record.link_quality || inferLinkQuality(record);
    record.id = generatePaperId(record);
    return { month, record };
  }

  function validateManualRecord(record, month) {
    const errors = [];
    if (!month) errors.push("Month is required.");
    if (!record.title) errors.push("Title is required.");
    if (!record.doi && !record.url) errors.push("Add at least one DOI or URL.");
    if (Number.isNaN(record.relevance_score)) errors.push("Relevance must be a number from 0 to 1.");
    if (record.relevance_score < 0 || record.relevance_score > 1) errors.push("Relevance must be between 0 and 1.");
    return errors;
  }

  function manualRecordSnippet(record) {
    return JSON.stringify(record, null, 2);
  }

  function updateManualOutput() {
    const { record } = manualRecordFromForm();
    els.manualOutput.value = manualRecordSnippet(record);
  }

  function saveManualDraft() {
    normalizeManualLinks();
    const { month, record } = manualRecordFromForm();
    const errors = validateManualRecord(record, month);
    if (errors.length) {
      setManualStatus(errors.join(" "), "error");
      return;
    }

    const drafts = loadManualDrafts();
    const selectedId = els.manualDraftSelect.value;
    const draftId = selectedId || `draft-${Date.now()}`;
    const nextDraft = { draftId, month, record, updatedAt: new Date().toISOString() };
    const nextDrafts = drafts.filter((draft) => draft.draftId !== draftId).concat(nextDraft);
    saveManualDrafts(nextDrafts);
    renderManualDrafts(draftId);
    setManualStatus("Saved locally.", "ok");
    updateManualOutput();
  }

  async function copyManualRecord() {
    normalizeManualLinks();
    const { month, record } = manualRecordFromForm();
    const errors = validateManualRecord(record, month);
    if (errors.length) {
      setManualStatus(errors.join(" "), "error");
      return;
    }

    await writeClipboard(manualRecordSnippet(record));
    setManualStatus("JS record copied.", "ok");
  }

  function downloadManualJson() {
    normalizeManualLinks();
    const { month, record } = manualRecordFromForm();
    const errors = validateManualRecord(record, month);
    if (errors.length) {
      setManualStatus(errors.join(" "), "error");
      return;
    }

    downloadText(`${record.id}.json`, JSON.stringify({ month, record }, null, 2), "application/json");
    setManualStatus("JSON downloaded.", "ok");
  }

  function downloadManualJs() {
    normalizeManualLinks();
    const { month, record } = manualRecordFromForm();
    const errors = validateManualRecord(record, month);
    if (errors.length) {
      setManualStatus(errors.join(" "), "error");
      return;
    }

    const content = `// Insert this object into data/weekly/${month}.js papers array.\n${manualRecordSnippet(record)}\n`;
    downloadText(`${record.id}.js`, content, "text/javascript");
    setManualStatus("JS snippet downloaded.", "ok");
  }

  function deleteManualDraft() {
    const selectedId = els.manualDraftSelect.value;
    if (!selectedId) {
      setManualStatus("Select a draft to delete.", "error");
      return;
    }

    saveManualDrafts(loadManualDrafts().filter((draft) => draft.draftId !== selectedId));
    renderManualDrafts("");
    resetManualForm();
    setManualStatus("Draft deleted.", "ok");
  }

  function downloadText(filename, content, type) {
    const blob = new Blob([content], { type });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    link.click();
    URL.revokeObjectURL(url);
  }

  async function writeClipboard(text) {
    try {
      await navigator.clipboard.writeText(text);
    } catch (_error) {
      const textarea = document.createElement("textarea");
      textarea.value = text;
      textarea.style.position = "fixed";
      textarea.style.opacity = "0";
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand("copy");
      textarea.remove();
    }
  }

  function bindEvents() {
    els.manualForm.addEventListener("submit", (event) => {
      event.preventDefault();
    });

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
      await writeClipboard(formatCitation(paper));
      els.copyCitationButton.textContent = "Copied";
      window.setTimeout(() => {
        els.copyCitationButton.textContent = "Copy Citation";
      }, 1200);
    });

    els.exportButton.addEventListener("click", exportFiltered);
    els.addPaperButton.addEventListener("click", openManualPanel);
    els.closeManualButton.addEventListener("click", closeManualPanel);
    els.manualBackdrop.addEventListener("click", closeManualPanel);
    els.normalizeLinkButton.addEventListener("click", normalizeManualLinks);
    els.saveDraftButton.addEventListener("click", saveManualDraft);
    els.copyRecordButton.addEventListener("click", copyManualRecord);
    els.downloadJsonButton.addEventListener("click", downloadManualJson);
    els.downloadJsButton.addEventListener("click", downloadManualJs);
    els.deleteDraftButton.addEventListener("click", deleteManualDraft);
    els.clearManualButton.addEventListener("click", resetManualForm);
    els.manualDraftSelect.addEventListener("change", (event) => loadManualDraft(event.target.value));

    [
      els.manualMonth,
      els.manualPublishedDate,
      els.manualDoi,
      els.manualUrl,
      els.manualTitle,
      els.manualAuthors,
      els.manualYear,
      els.manualSource,
      els.manualPaperType,
      els.manualPriority,
      els.manualRelevance,
      els.manualLinkQuality,
      els.manualSummary,
      els.manualWhy,
      els.manualCaveats,
      els.manualTags
    ].forEach((element) => {
      element.addEventListener("input", updateManualOutput);
      element.addEventListener("change", updateManualOutput);
    });
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
  renderManualDrafts();
  render();
})();
