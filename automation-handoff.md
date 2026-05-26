# Automation Handoff

Use this when connecting the weekly scheduled task to the site.

## Output Target

Write one weekly JavaScript data file:

```text
/Users/chenzijin/Documents/Codex project/literature-radar/data/weekly/YYYY-MM-DD.js
```

The site loads weekly files listed in:

```text
/Users/chenzijin/Documents/Codex project/literature-radar/data/manifest.js
```

When adding a new week:

1. Write `data/weekly/YYYY-MM-DD.js`.
2. Add that path to the top of `data/manifest.js` so the newest week appears first.
3. Commit and push to trigger GitHub Pages deployment.

## Improved Automation Prompt

Find the latest high-impact and fast-moving research literature on the intersection of sea ice, the Southern Ocean, and carbon uptake. Search scholarly sources and preprint servers where available. Prioritize the last 7 days; expand to the last 30 days when weekly results are sparse.

Return structured data for the Literature Radar site. Include only verified bibliographic records, and do not invent DOI, author, source, or publication dates.

For each paper, produce:

- stable id
- title
- authors
- year
- source
- DOI or stable URL
- publication date
- paper type
- priority: `read_first`, `track`, `background`, or `low`
- 2-3 sentence summary covering question, method, and main finding
- why it matters for Southern Ocean sea ice and carbon uptake
- caveats, especially if preprint or indirect relevance
- tags
- relevance score from 0 to 1

Use query variants including:

- "Southern Ocean sea ice carbon uptake"
- "Antarctic sea ice CO2 uptake"
- "sea ice carbon cycle Southern Ocean"
- "sea ice algae carbon export"
- "Southern Ocean carbon sink sea ice"
- "Antarctic marginal ice zone carbon uptake"
- "air-sea CO2 flux Antarctic sea ice"
- "Southern Ocean carbon sink sea ice decline"

At the end, include a weekly synthesis describing emerging themes, disagreements, and the 1-3 papers to read first.

## Suggested Upgrade Path

1. Add BibTeX or RIS export per selected paper.
2. Add Zotero collection export once verified citation metadata is available.
3. Add duplicate detection for preprint, accepted manuscript, and journal version records.
4. Add an automation step that commits the new weekly file and updated manifest.
