# Southern Ocean Literature Radar

Local reading dashboard for a weekly literature scan on sea ice, the Southern Ocean, and carbon uptake.

## Open

Open `index.html` in a browser.

For local verification with the same URL behavior as deployment:

```bash
python3 -m http.server 8765
```

Then open `http://127.0.0.1:8765/index.html`.

## Project Layout

```text
literature-radar/
  index.html
  styles.css
  app.js
  data/manifest.js
  data/weekly/2026-06-01.js
  assets/southern-ocean-lines.svg
  automation-handoff.md
```

## Data Contract

Weekly data files append one week to `window.LITERATURE_WEEKS`. Each week has this shape:

```js
window.LITERATURE_WEEKS = window.LITERATURE_WEEKS || [];
window.LITERATURE_WEEKS.push({
  id: "2026-06-01",
  date: "2026-06-01",
  title: "Weekly Scan: Southern Ocean Sea Ice and Carbon Uptake",
  synthesis: "Short trend summary.",
  papers: [
    {
      id: "stable-paper-id",
      title: "",
      authors: [],
      year: 2026,
      source: "",
      doi: "",
      url: "",
      published_date: "2026-06-01",
      paper_type: "peer-reviewed",
      priority: "read_first",
      summary: "",
      why_it_matters: "",
      caveats: "",
      tags: ["Southern Ocean", "sea ice", "carbon uptake"],
      relevance_score: 0.9,
      reading_status: "to_read",
      notes: ""
    }
  ]
});
```

Recommended `priority` values: `read_first`, `track`, `background`, `low`.

Recommended `paper_type` values: `peer-reviewed`, `preprint`, `review`, `dataset`, `methods`, `template`.

Reading status and notes are stored in browser `localStorage`, so the source data stays clean.

## Deployment

This repo is ready for GitHub Pages as a static site served from the `main` branch root.

1. Push this directory as the root of a GitHub repository.
2. In the repository settings, enable Pages with `Deploy from a branch`.
3. Select branch `main` and folder `/ (root)`.

The site has no build step and no server dependency.
