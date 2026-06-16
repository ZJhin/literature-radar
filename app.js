(async function () {
  const storagePrefix = "so-lit-radar:";
  const manualDraftsKey = "so-lit-radar:manual-drafts";
  const seaIceCollectionId = "antarctic-sea-ice";
  const scopeLabels = {
    all: "All Radar",
    "antarctic-sea-ice": "Antarctic Sea Ice"
  };
  const seaIceFocusAreas = [
    {
      id: "observations",
      label: "Observations",
      keywords: ["observational", "satellite", "remote sensing", "bgc-argo", "profiles", "isotope", "measurements"]
    },
    {
      id: "processes",
      label: "Processes",
      keywords: ["stratification", "mixing", "winter water", "cdw", "salinity", "meltwater", "poc", "pn", "sea-ice algae", "biogeochemistry"]
    },
    {
      id: "climate-drivers",
      label: "Climate drivers",
      keywords: ["wind", "westerlies", "drivers", "climate", "precipitation", "warming", "heat uptake", "destratification"]
    },
    {
      id: "models",
      label: "Models",
      keywords: ["model", "modeling", "modelling", "cmip", "sosim", "simulated", "simulation"]
    },
    {
      id: "impacts",
      label: "Impacts",
      keywords: ["ecosystems", "phytoplankton", "krill", "salps", "carbon export", "carbon uptake", "carbon storage", "carbon cycle", "biological pump"]
    },
    {
      id: "data-reports",
      label: "Data / reports",
      keywords: ["dataset", "report", "review", "synthesis", "methods", "opinion", "research priorities"]
    }
  ];

  await loadWeeklyData();
  const weeks = window.LITERATURE_WEEKS || [];

  const state = {
    scope: initialScope(),
    weekId: weeks[0]?.id || "",
    seaIceFocus: "all",
    search: "",
    type: "all",
    status: "all",
    tags: new Set(),
    sort: "relevance",
    viewMode: localStorage.getItem(`${storagePrefix}view-mode`) || "compact",
    tagsExpanded: false,
    selectedId: ""
  };

  const els = {
    weekSelect: document.getElementById("weekSelect"),
    scopeButtons: Array.from(document.querySelectorAll(".scope-button")),
    seaIceFocusField: document.getElementById("seaIceFocusField"),
    seaIceFocusSelect: document.getElementById("seaIceFocusSelect"),
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
    collectionPanel: document.getElementById("collectionPanel"),
    collectionTitle: document.getElementById("collectionTitle"),
    collectionSummary: document.getElementById("collectionSummary"),
    collectionReadFirst: document.getElementById("collectionReadFirst"),
    collectionFocusGrid: document.getElementById("collectionFocusGrid"),
    paperList: document.getElementById("paperList"),
    detailEmpty: document.getElementById("detailEmpty"),
    paperDetail: document.getElementById("paperDetail"),
    detailPriority: document.getElementById("detailPriority"),
    detailStatus: document.getElementById("detailStatus"),
    detailTitle: document.getElementById("detailTitle"),
    detailCitation: document.getElementById("detailCitation"),
    detailBadges: document.getElementById("detailBadges"),
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
    tagToggleButton: document.getElementById("tagToggleButton"),
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
    manualCollections: document.getElementById("manualCollections"),
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

  function initialScope() {
    return window.location.hash === "#antarctic-sea-ice" ? "antarctic-sea-ice" : "all";
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

  function linkQualityLabel(value) {
    return {
      doi: "DOI",
      journal_page: "Journal",
      preprint: "Preprint",
      news_only: "News only"
    }[value] || "Source";
  }

  function relevanceKind(paper) {
    if (paper.relevance_kind) return paper.relevance_kind;
    if ((paper.relevance_score || 0) >= 0.88) return "Direct";
    if ((paper.relevance_score || 0) >= 0.72) return "Mechanistic";
    if ((paper.relevance_score || 0) >= 0.6) return "Context";
    return "Background";
  }

  function normalize(value) {
    return String(value || "").toLowerCase();
  }

  function allPapers() {
    return (currentWeek()?.papers || []).map(enrichPaper);
  }

  function paperText(paper) {
    return normalize([
      paper.title,
      paper.authors?.join(" "),
      paper.source,
      paper.doi,
      paper.tags?.join(" "),
      paper.summary,
      paper.why_it_matters,
      paper.caveats
    ].join(" "));
  }

  function paperCollections(paper) {
    const explicit = Array.isArray(paper.collections) ? paper.collections : [];
    const derived = isAntarcticSeaIcePaper(paper) ? [seaIceCollectionId] : [];
    return Array.from(new Set(explicit.concat(derived)));
  }

  function isAntarcticSeaIcePaper(paper) {
    const text = paperText(paper);
    return text.includes("sea ice") || text.includes("sea-ice") || text.includes("antarctic sea ice");
  }

  function seaIceCategories(paper) {
    const text = paperText(paper);
    return seaIceFocusAreas
      .filter((area) => area.keywords.some((keyword) => text.includes(keyword)))
      .map((area) => area.id);
  }

  function scopedPapers() {
    const papers = allPapers();
    if (state.scope !== seaIceCollectionId) return papers;

    return seaIcePapers().filter((paper) => {
      const inFocus = state.seaIceFocus === "all" || seaIceCategories(paper).includes(state.seaIceFocus);
      return inFocus;
    });
  }

  function seaIcePapers() {
    return allPapers().filter((paper) => paperCollections(paper).includes(seaIceCollectionId));
  }

  function filteredPapers() {
    const query = normalize(state.search);
    const selectedTags = Array.from(state.tags);

    const result = scopedPapers().filter((paper) => {
      const haystack = paperText(paper);

      const matchesQuery = !query || haystack.includes(query);
      const matchesType = state.type === "all" || paper.paper_type === state.type;
      const matchesStatus = state.status === "all" || paper.reading_status === state.status;
      const matchesTags = selectedTags.length === 0 || selectedTags.every((tag) => paper.tags?.includes(tag));
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
    els.scopeButtons.forEach((button) => {
      button.classList.toggle("is-active", button.dataset.scope === state.scope);
      button.setAttribute("aria-current", button.dataset.scope === state.scope ? "page" : "false");
    });
    els.seaIceFocusField.hidden = state.scope !== seaIceCollectionId;
    els.seaIceFocusSelect.value = state.seaIceFocus;

    els.weekSelect.innerHTML = weeks.map((week) => (
      `<option value="${week.id}">${week.date}</option>`
    )).join("");
    els.weekSelect.value = state.weekId;

    const papers = scopedPapers();
    const types = Array.from(new Set(papers.map((paper) => paper.paper_type))).sort();
    els.typeSelect.innerHTML = `<option value="all">All types</option>${types.map((type) => (
      `<option value="${type}">${type}</option>`
    )).join("")}`;
    els.typeSelect.value = state.type;

    const tagCounts = papers.reduce((counts, paper) => {
      (paper.tags || []).forEach((tag) => {
        counts.set(tag, (counts.get(tag) || 0) + 1);
      });
      return counts;
    }, new Map());
    const tags = Array.from(tagCounts.keys()).sort((a, b) => tagCounts.get(b) - tagCounts.get(a) || a.localeCompare(b));
    const visibleTags = state.tagsExpanded
      ? tags
      : Array.from(new Set(tags.slice(0, 12).concat(Array.from(state.tags))));
    els.tagToggleButton.hidden = tags.length <= 12;
    els.tagToggleButton.textContent = state.tagsExpanded ? "Less" : `More (${tags.length - 12})`;
    els.tagFilters.innerHTML = visibleTags.map((tag) => {
      const active = state.tags.has(tag) ? " is-active" : "";
      return `<button class="tag-chip${active}" data-tag="${tag}" type="button">${escapeHtml(tag)} <span>${tagCounts.get(tag)}</span></button>`;
    }).join("");
  }

  function renderBrief() {
    const week = currentWeek();
    const papers = scopedPapers();
    const isSeaIce = state.scope === seaIceCollectionId;

    els.briefDate.textContent = week?.date || "";
    els.briefTitle.textContent = isSeaIce
      ? `Antarctic Sea Ice | ${week?.date || ""}`
      : week?.title || "No monthly brief";
    els.briefSummary.textContent = isSeaIce
      ? seaIceBriefText(papers, week)
      : week?.synthesis || "";
    els.paperCount.textContent = papers.length;
    els.readFirstCount.textContent = papers.filter((paper) => paper.priority === "read_first").length;
    els.preprintCount.textContent = papers.filter((paper) => paper.paper_type === "preprint").length;
  }

  function seaIceBriefText(papers, week) {
    if (!papers.length) {
      return "No Antarctic sea-ice records are tagged for this month yet. Switch back to All Radar or add a paper with sea ice tags to populate this column.";
    }

    const focusLabels = seaIceFocusAreas
      .filter((area) => papers.some((paper) => seaIceCategories(paper).includes(area.id)))
      .map((area) => area.label.toLowerCase());
    const focusText = focusLabels.length ? ` Focus areas this month: ${focusLabels.join(", ")}.` : "";
    return `A dedicated view of Antarctic sea-ice papers and close process context for ${week?.date || "this month"}.${focusText}`;
  }

  function renderCollectionPanel() {
    if (state.scope !== seaIceCollectionId) {
      els.collectionPanel.hidden = true;
      return;
    }

    const papers = seaIcePapers();
    const visiblePapers = scopedPapers();
    els.collectionPanel.hidden = false;
    els.collectionTitle.textContent = "Antarctic Sea Ice";
    els.collectionSummary.textContent = "Focused reading lane for Antarctic sea-ice variability, mechanisms, modelling, ecosystem effects, and links to Southern Ocean carbon-cycle interpretation.";

    const readFirst = visiblePapers
      .filter((paper) => paper.priority === "read_first")
      .sort((a, b) => (b.relevance_score || 0) - (a.relevance_score || 0))
      .slice(0, 4);
    els.collectionReadFirst.innerHTML = readFirst.length
      ? readFirst.map((paper) => `<li><button type="button" data-jump-paper="${paper.id}">${escapeHtml(paper.title)}</button></li>`).join("")
      : `<li>No read-first sea-ice records this month.</li>`;

    els.collectionFocusGrid.innerHTML = seaIceFocusAreas.map((area) => {
      const count = papers.filter((paper) => seaIceCategories(paper).includes(area.id)).length;
      const active = state.seaIceFocus === area.id ? " is-active" : "";
      return `
        <button class="focus-card${active}" type="button" data-focus="${area.id}">
          <span>${escapeHtml(area.label)}</span>
          <strong>${count}</strong>
        </button>
      `;
    }).join("");
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
      const tags = (paper.tags || []).slice(0, 5).map((tag) => `<span class="tag-chip">${tag}</span>`).join("");
      const linkBadge = paper.doi || paper.url ? `<span class="quality-badge">${linkQualityLabel(paper.link_quality || inferLinkQuality(paper))}</span>` : "";
      const relevanceBadge = `<span class="quality-badge relevance">${relevanceKind(paper)}</span>`;
      const collectionBadge = state.scope === seaIceCollectionId ? `<span class="quality-badge ice">Sea ice</span>` : "";
      return `
        <button class="paper-card ${state.viewMode}${selected}" data-paper-id="${paper.id}" type="button">
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
            ${linkBadge}
            ${relevanceBadge}
            ${collectionBadge}
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
    els.detailBadges.innerHTML = [
      `<span class="quality-badge">${linkQualityLabel(paper.link_quality || inferLinkQuality(paper))}</span>`,
      `<span class="quality-badge relevance">${relevanceKind(paper)}</span>`,
      paperCollections(paper).includes(seaIceCollectionId) ? `<span class="quality-badge ice">Sea ice</span>` : ""
    ].join("");
    els.detailTags.innerHTML = (paper.tags || []).map((tag) => `<span class="tag-chip">${tag}</span>`).join("");
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

  function setFieldError(element, errorElement, message) {
    element.toggleAttribute("aria-invalid", Boolean(message));
    errorElement.textContent = message || "";
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
    els.manualCollections.value = state.scope === seaIceCollectionId ? seaIceCollectionId : "";
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
    els.manualCollections.value = (record.collections || []).join(", ");
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
      collections: splitTags(els.manualCollections.value),
      relevance_score: relevance,
      reading_status: "to_read",
      notes: ""
    };

    record.link_quality = record.link_quality || inferLinkQuality(record);
    if (!record.collections.length && isAntarcticSeaIcePaper(record)) {
      record.collections = [seaIceCollectionId];
    }
    record.id = generatePaperId(record);
    return { month, record };
  }

  function validateManualRecord(record, month) {
    const errors = [];
    const monthError = !month ? "Month is required." : "";
    const titleError = !record.title ? "Title is required." : "";
    const linkError = !record.doi && !record.url ? "Add at least one DOI or URL." : "";
    const relevanceError = Number.isNaN(record.relevance_score) || record.relevance_score < 0 || record.relevance_score > 1
      ? "Use a number from 0 to 1."
      : "";

    setFieldError(els.manualMonth, document.getElementById("manualMonthError"), monthError);
    setFieldError(els.manualTitle, document.getElementById("manualTitleError"), titleError);
    setFieldError(els.manualDoi, document.getElementById("manualLinkError"), linkError);
    setFieldError(els.manualRelevance, document.getElementById("manualRelevanceError"), relevanceError);

    [monthError, titleError, linkError, relevanceError].filter(Boolean).forEach((error) => errors.push(error));
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

    els.scopeButtons.forEach((button) => {
      button.addEventListener("click", () => {
        setScope(button.dataset.scope);
      });
    });

    els.seaIceFocusSelect.addEventListener("change", (event) => {
      state.seaIceFocus = event.target.value;
      state.type = "all";
      state.tags.clear();
      state.selectedId = "";
      render();
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

    els.tagToggleButton.addEventListener("click", () => {
      state.tagsExpanded = !state.tagsExpanded;
      renderControls();
    });

    document.querySelectorAll(".sort-button").forEach((button) => {
      button.addEventListener("click", () => {
        state.sort = button.dataset.sort;
        document.querySelectorAll(".sort-button").forEach((item) => item.classList.remove("is-active"));
        button.classList.add("is-active");
        renderList();
      });
    });

    document.querySelectorAll(".view-button").forEach((button) => {
      button.classList.toggle("is-active", button.dataset.view === state.viewMode);
      button.addEventListener("click", () => {
        state.viewMode = button.dataset.view;
        localStorage.setItem(`${storagePrefix}view-mode`, state.viewMode);
        document.querySelectorAll(".view-button").forEach((item) => item.classList.remove("is-active"));
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

    els.collectionPanel.addEventListener("click", (event) => {
      const focusButton = event.target.closest("[data-focus]");
      if (focusButton) {
        state.seaIceFocus = state.seaIceFocus === focusButton.dataset.focus ? "all" : focusButton.dataset.focus;
        state.type = "all";
        state.tags.clear();
        state.selectedId = "";
        render();
        return;
      }

      const paperButton = event.target.closest("[data-jump-paper]");
      if (paperButton) {
        state.selectedId = paperButton.dataset.jumpPaper;
        renderList();
        document.querySelector(`[data-paper-id="${CSS.escape(state.selectedId)}"]`)?.focus();
      }
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

    window.addEventListener("hashchange", () => {
      setScope(initialScope(), { updateHash: false });
    });
    window.addEventListener("popstate", () => {
      setScope(initialScope(), { updateHash: false });
    });

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
      els.manualTags,
      els.manualCollections
    ].forEach((element) => {
      element.addEventListener("input", updateManualOutput);
      element.addEventListener("change", updateManualOutput);
    });
  }

  function setScope(scope, options = {}) {
    const nextScope = scopeLabels[scope] ? scope : "all";
    if (state.scope === nextScope) return;

    state.scope = nextScope;
    state.seaIceFocus = "all";
    state.type = "all";
    state.tags.clear();
    state.selectedId = "";

    if (options.updateHash !== false) {
      if (nextScope === seaIceCollectionId) {
        window.history.pushState(null, "", "#antarctic-sea-ice");
      } else {
        window.history.pushState(null, "", window.location.pathname + window.location.search);
      }
    }

    render();
  }

  function render() {
    renderControls();
    renderBrief();
    renderCollectionPanel();
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
