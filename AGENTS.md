# Rocket Away — agent guide

Read this file before changing the project. `README.md` documents the player experience and current balance; source constants are authoritative for exact values. Keep both documents current when behavior or workflow changes.

## Project and workflow

- A static, mobile-first launch-and-upgrade game using HTML, CSS, canvas, and native JavaScript ES modules. No bundler, npm dependencies, backend, analytics, or API keys.
- Repository: https://github.com/georgemclaughlin/rocketaway
- Live game: https://georgemclaughlin.github.io/rocketaway/
- GitHub Pages serves the repository root on `main`; retain `.nojekyll` and relative asset/module URLs so repository-subpath hosting works.
- `ROGUELITE_PLAN.md` is the accepted implementation direction. The Earth–Moon roguelite is the public default, authorized by the owner. The original campaign remains accessible from the menu (`?campaign=original`), with separate progress. Broader campaign expansion awaits human playtesting. Treat the prototype exceptions below as scoped to versioned roguelite sessions.
- `npm start` serves port 4173 on all interfaces for same-network phone testing. Check for an existing server before starting another. Keep shared preview servers running.
- Routine fixes and requested game improvements have existing authorization to be committed and published to this repository. Follow any newer user instruction that changes that scope. Reviews alone do not require implementation or deployment.
- Preserve unrelated working-tree changes. Do not reset a player's save while testing. Prefer the established Playwright CLI workflow.
- Use a fresh reviewer when requested. Treat findings as evidence to investigate; do not claim an entire campaign was played when only fixtures or part of it were checked.

## Product decisions to preserve

- The core loop is **hangar → launch timing → automatic flight → report → refit**. Players choose parts, not continuous steering. Do not restore forced route/module drafts or interrupt flights with event popups.
- The journey is Earth → Moon → Mars → Ceres → Europa → Titan → Triton → Pluto → Eris → Tau Ceti. Tau Ceti is the final star destination, not an invented planetary landing site.
- Each world has six cumulative altitude milestones. One strong flight earns every milestone actually crossed. Three misses end the current attempt; unlocked worlds and permanent research survive. Ending an expedition and resetting the entire game are different actions.
- Each new world/attempt starts a fresh rocket and budget. Explain that transition clearly. Keep the current world, next goal, overall journey position, and remaining misses understandable.
- Prototype exception: Earth and Moon share one rocket, credits, and three-miss budget. A new milestone or an unfinished selected contract makes a flight successful. Clearing Earth permanently unlocks a fresh funded Moon checkpoint start. The prototype ends after the Moon; do not imply the full planned campaign is implemented.
- Credits buy parts for the current rocket. Research points buy permanent, kit-specific upgrades. Preserve the visible research button and its distinct states for an affordable current-kit upgrade, other-kit upgrades, and no affordable upgrade.
- The roguelite uses one horizontally scrolling parts shelf per selected rocket section, showing owned/stocked standard and experimental equipment together. Keep the selected preview visible after resizing. Contracts belong in the journey goal area; reservation belongs in the part Info dialog. Do not restore the changing Standard/Experimental toggle or make browsing jump sections.
- Selecting a part previews it; only Buy & fit / Fit part changes the equipped rocket. Keep fitted and preview values visually distinct. Explain base tradeoffs separately from seeded part bonuses.
- Height estimates use 110% launch power; timing ranges from 90% to 120%. Miss advice must distinguish a reachable timing opportunity from a build limitation. Suggest a useful experiment without silently choosing or purchasing a part.
- Fast Forward is **one on/off toggle**, not a multiplier cycle. It measures the remaining flight once and aims for about six real-time seconds to the result, never slowing a shorter flight. It stays selected between launches during a visit; pause stops advancement. Do not recalculate the rate every frame, which would keep moving the finish away.
- `flight-playback.js` uses fixed 1/120-second ticks and carries fractional time between frames. Playback speed must not change the outcome. `See result` also resolves the real trajectory and settles rewards only once.
- The main game phases must fit the viewport without vertical scrolling. Keep flight controls clear of the rocket and destination. World selection deliberately scrolls horizontally with targets at least 48 px wide; keep the selected world visible.
- Reward feedback distinguishes first/multiple milestones, records, new starting rockets, and world departure. Avoid extra mandatory dialogs. Differences below 10 metres do not earn a new-best headline because they can appear unchanged at displayed precision.
- Preserve the skippable travel animation, reduced-motion support, dedicated Tau Ceti ending, persistent journey statistics, and explicitly optional replay.
- Educational facts belong in `science-data.js`, with primary NASA sources. Verify new scientific claims. Keep real scientific facts separate from deliberately simplified arcade forces, altitude targets, and travel times.
- A framework migration is allowed if it solves a concrete testing or maintenance need. Pure domain modules and browser tests already provide coverage; a migration is not an outstanding requirement.

## Source map

| Area | Files |
| --- | --- |
| Layout, canvas, input, persistence, screen transitions | `index.html`, `style.css`, `game.js` |
| Physics and legacy Free Flight | `engine.js`, `flight-playback.js`, `modifiers.js` |
| Catalog, assembly, seeded part traits, fitting, previews | `parts.js`, `builder.js`, `part-insights.js` |
| Expedition state, stock, rewards, save migration | `expeditions.js` |
| Worlds, versioned conditions, milestone map, travel | `worlds.js`, `journey.js`, `travel.js` |
| Starting-build screen and equipment summaries | `expedition-ui.js`, `kit-details.js` |
| Permanent research mechanics and lab UI | `research.js`, `research-ui.js` |
| Timing ratings, miss explanations, progress headlines | `launch-feedback.js`, `flight-feedback.js` |
| Persistent statistics and records display | `flight-records.js`, `journey-records-ui.js` |
| Educational facts and optional world guide | `science-data.js`, `science-ui.js` |
| Roguelite abilities, contracts, stock, carryover, save guard | `experimental.js`, `prototype-run.js`, `campaign-save.js`; integration in the existing builder, engine, and UI |

Keep new domain logic independent of DOM/storage where practical. Avoid circular imports. The builder estimates flights through the same physics used by gameplay.

## Saves and balance

- Storage keys: `rocket-away-program-v1` and `rocket-away-expeditions-v1`. Saves are per browser and origin; local and hosted games have separate progress. Reset only this game's keys in production code.
- Do not rename storage keys or discard old saves to simplify a change. Preserve migration, interrupted-flight quality, one-time rewards, research, and records. An expedition resumed after reload restarts ignition with its saved build and timing.
- Original-campaign flight/balance conditions are version **3**. Existing v0/v1/v2 expeditions retain their original physics, targets, stock rules, and earnings. Pass a run's `conditionsVersion` through condition/goal lookups. New original-campaign runs use version 3; roguelite runs use version 4.
- Prototype sessions use `prototypeVersion: 1`, run/program `rulesVersion: 1`, and conditions version **4** without changing the default `CONDITIONS_VERSION`. Preserve all v0–v3 behavior. Future unsupported saves must remain untouched; the export recovery UI must not persist a replacement session. Both campaigns use the existing expedition key. `campaign-save.js` writes a version 1 campaign envelope with the roguelite at the root and preserved original data under `originalCampaign`. Validate both campaigns before writing; switching must preserve interrupted flights, research, and records. Reset entire game resets both campaigns.
- `node checks/prototype-audit.js` samples five seeds, three kits, ranks 0/5, and Earth/Moon starts. Its contract policy can refit for earnings and use perfect timing when sufficient. Initial results were 60/60 completions, with full Earth–Moon runs taking 4–8 launches; the proposed longer-session target is not yet achieved or human-validated.
- Balance changes must test optimal affordable purchases and fully researched starts as well as normal play. Do not add arbitrary milestone caps, mandatory launch counts, or goals that rise when the player buys research.
- `node checks/balance-audit.js` exhausts affordable opening builds across five seeds, three kits, and nine worlds at maximum research and perfect timing. The v2/v3 comparison was 65/135 versus 10/135 possible first-launch world clears. Five remaining cases were Earth replays. These are simulated possibilities, not player telemetry.
- Use `tests/world-progression.test.js` to check earned full journeys, save compatibility, and world-specific choices. See README for current milestone targets, world funding, and research effects.

## Verification

1. Run `npm test` for relevant mechanics/persistence changes. It uses Node's built-in test runner, with no dependency installation needed.
2. Run appropriate `checks/*.playwright.js` in a **new, uniquely named isolated browser session**. These scripts deliberately seed or clear that session's storage. Never attach them to a player's browser.
3. Check phones at 320×568, 375×667, and 390×844; landscape at 667×375 and 844×390; and desktop at 1366×768 when layout is affected. Check readable text, overlap, tap targets, and essential actions as well as overflow bounds. Inspect screenshots for visual changes.
4. Inspect the CLI's `### Result` / `### Error` output: a script assertion may be reported despite a zero shell exit code. Check browser console errors. Save temporary scripts, browser configuration, logs, and screenshots outside tracked files; close only the test session you opened.
5. Run `git diff --check` and review the staged diff. Do not rerun unrelated checks once they pass unless new changes or failures justify it.

Typical CLI use, with an externally stored `--config` if the installed browser needs one:

```sh
playwright-cli -s=rocketaway-review open http://127.0.0.1:4173/
playwright-cli -s=rocketaway-review run-code "$(cat checks/polish.playwright.js)"
playwright-cli -s=rocketaway-review close
```

Useful browser checks:

- `prototype.playwright.js` and `prototype-journey.playwright.js`: run only on port 4174 in an isolated session. Cover experimental previews, reservation, contracts, ability flight parity, saved travel, unsupported-save protection, and earned UI progression. Keep these separate from default-game fixtures.

- `mobile-builder.playwright.js`: unified browsing, section stability, preview versus fitting, reservation explanation, optional goals, six viewport touch targets, and price/overlap visibility.
- `campaign-switch.playwright.js`: public default, existing-save preservation, six-size campaign menu, switching, and launch/reload; isolated session only.
- Original-campaign browser checks must open `?campaign=original` and read the saved `originalCampaign` member.
- `polish.playwright.js`: all part previews, first-start clarity, real miss diagnosis, starting builds, wider world selection.
- `world-challenges.playwright.js`: nine-world briefings/budgets, legacy saves, coast skipping, fast-forward preference.
- `science.playwright.js`: atmosphere HUD, guide pause/resume, previews, unlock reports, ending/records layouts.
- `flight-speeds.playwright.js`: despite its historical filename, checks the **single adaptive Fast Forward toggle**, consistent Earth/Moon/Ceres completion time, pause/resume, and outcome integrity.
- `journey.playwright.js`: journey transitions, travel, resets, and reduced motion.
- `research*.playwright.js`, `ending.playwright.js`, `journey-records.playwright.js`, `launch-rating.playwright.js`, `flight-controls.playwright.js`: targeted checks for those features.

## Publishing and privacy

- This is a public repository. Do not commit private information, local machine paths, LAN addresses, credentials, private configuration, browser profiles, screenshots of personal content, source photographs, or temporary logs.
- The approved bundled illustration is `assets/astronaut-cartoon.png?v=2`. An earlier portrait was intentionally removed from Git history and its old asset filename remains ignored. Do not recover it, re-add it, or include source/reference photographs. Do not change the cartoon likeness without a request.
- Respect `.gitignore`; do not force-add ignored material. Use the repository's existing public-safe Git author configuration rather than introducing a personal email.
- Before pushing, review every staged file for privacy and scope. Keep asset paths relative and retain existing site/repository settings.
- Modules and CSS use query-string cache versions. Update the entry-point URLs and affected transitive import graph coherently when deploying changed code; avoid mixing revisions of shared modules. The app currently uses `v=mobile-builder-1`; the cartoon's independent `v=2` is intentional.
- Push the validated commit to `main`, then confirm Pages built that commit with `gh api repos/georgemclaughlin/rocketaway/pages/builds/latest --jq '{status,commit}'`. For game changes, run an isolated live-site smoke check and give the user the public game link. A documentation-only change does not require replaying the game.

## Remaining design opportunity

The Earth–Moon roguelite prototype is ready for human playtesting. Broader research unlocks, rocket collections, three-world expeditions, and the longer campaign remain planned in `ROGUELITE_PLAN.md`. Prioritize evidence about build variety, recovery, and pacing before expanding it. Keep automated play, agent walkthroughs, and human feedback clearly distinguished.
