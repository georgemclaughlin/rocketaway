# Rocket Away — agent guide

Read this file before changing the project. `README.md` documents the player experience and current balance; source constants are authoritative for exact values. Keep both documents current when behavior or workflow changes.

## Project and workflow

- A static, mobile-first launch-and-upgrade game using HTML, CSS, canvas, and native JavaScript ES modules. No bundler, npm dependencies, backend, analytics, or API keys.
- Repository: https://github.com/georgemclaughlin/rocketaway
- Live game: https://georgemclaughlin.github.io/rocketaway/
- GitHub Pages serves the repository root on `main`; retain `.nojekyll` and relative asset/module URLs so repository-subpath hosting works.
- `ROGUELITE_PLAN.md` is the accepted implementation direction. The roguelite journey through all nine worlds is the public default, authorized by the owner. The original campaign remains accessible from the menu (`?campaign=original`), with separate progress. Grouped multi-world expeditions beyond Earth–Moon and broader research still await design/playtesting. Treat the prototype exceptions below as scoped to versioned roguelite sessions.
- `npm start` serves port 4173 on all interfaces for same-network phone testing. Check for an existing server before starting another. Keep shared preview servers running.
- Routine fixes and requested game improvements have existing authorization to be committed and published to this repository. Follow any newer user instruction that changes that scope. Reviews alone do not require implementation or deployment.
- Preserve unrelated working-tree changes. Do not reset a player's save while testing. Prefer the established Playwright CLI workflow.
- Use a fresh reviewer when requested. Treat findings as evidence to investigate; do not claim an entire campaign was played when only fixtures or part of it were checked.

## Product decisions to preserve

- The core loop is **hangar → launch timing → automatic flight → report → refit**. Players choose parts, not continuous steering. Do not restore forced route/module drafts or interrupt flights with event popups.
- The journey is Earth → Moon → Mars → Ceres → Europa → Titan → Triton → Pluto → Eris → Tau Ceti. Tau Ceti is the final star destination, not an invented planetary landing site.
- Each world has six cumulative altitude milestones. One strong flight earns every milestone actually crossed. Three misses end the current attempt; unlocked worlds and permanent research survive. Ending an expedition and resetting the entire game are different actions.
- Each new world/attempt starts a fresh rocket and budget. Explain that transition clearly. Keep the current world, next goal, overall journey position, and remaining misses understandable.
- Prototype exception: Earth and Moon share one rocket, credits, and three-miss budget. A new milestone or an unfinished selected contract makes a flight successful. Clearing Earth permanently unlocks a fresh funded Moon checkpoint start. Clearing Moon unlocks Mars, then the rest of the established route to Tau Ceti. Mars onward uses fresh funded rockets per world with experimental parts and two contracts. Grouped three-world expeditions are still not implemented.
- New roguelite attempts use `missionVersion: 2`: two deterministic offers from four missions per world, one early and one later. Missing mission versions retain the original fixed pair. Reloads, refits, and shop refreshes must not reroll objectives. `profile.missionJournal` version 1 stores bounded permanent mission stamps, per-world kit badges, and winning builds. Keep Moon fresh/carried records separate; `worldStartFlights` marks the world-local launch boundary. Do not invent missing old launch counts. Journal browsing never fits or purchases parts.
- New roguelite attempts use run/program `equipmentVersion: 2`: Momentum engine, Drop tank, Return boosters, and companion-biased offers. Missing/version-1 equipment keeps the original six specials and deterministic stock. Preserve each version’s physics. Momentum ramps 65% → 190% over 10s. Drop tank releases only dry mass, scaled by research. Return boosters pay 90 only after separation AND a new milestone or selected contract; misses never earn recovery pay. Freeze recovery eligibility at ignition, settle once, and retain distinct report earnings. Previews/cache keys, playback, and reloads must agree.
- New attempts use `journeyVersion: 1`: first Moon–Pluto departures transfer 10% of closing credits (max 200) to `profile.launchFunding[nextWorld]`. A new rocket consumes that reservation into `pendingFunding`, paid once after its first completed flight, including a miss. Opening budgets do not change. Replays cannot repeat a first-clear transfer; Earth retains its carried budget and Eris has no next grant. Missing journey versions keep the old economy. Preserve pending funding on reload and campaign switching; ending a funded rocket before its first flight forfeits the grant.
- Combination warnings use resolved research/traits and never fit or spend. Flight logs compare consecutive same-world builds at 110% power, separately from actual timing, and retain actual ability outcomes and earnings. Do not invent a prior estimate for an old save. Clear the comparison at a world transition. Cosmetic stage debris uses presentation time, freezes while paused, and respects reduced motion; physics remains fixed-tick.
- Completed attempts default to the furthest unlocked world; earlier worlds are explicit replay choices. Old Moon-complete saves must unlock Mars without replaying rewards. Preserve the dedicated ending and optional replay after Eris.
- Credits buy parts for the current rocket. Research points buy permanent, kit-specific upgrades. Preserve the visible research button and its distinct states for an affordable current-kit upgrade, other-kit upgrades, and no affordable upgrade.
- The roguelite uses one horizontally scrolling parts shelf per selected rocket section, showing owned/stocked standard and experimental equipment together. Keep the selected preview visible after resizing. Contracts belong in the journey goal area; reservation belongs in the part Info dialog. Do not restore the changing Standard/Experimental toggle or make browsing jump sections.
- Selecting a part previews it; only Buy & fit / Fit part (or the whole-build equivalents) changes the equipped rocket. Roguelite previews retain choices across sections and quote the complete build. Commit purchases atomically after validating every part and the total cost. Discard and reload clear previews; Launch fitted discards the preview and flies the equipped build. Preview state is temporary and is never stored. Keep fitted and preview values visually distinct. Explain base tradeoffs separately from seeded part bonuses.
- Height estimates use 110% launch power; timing ranges from 90% to 120%. Show an amber timing cue when the goal needs more than 100% power, even if the 110% estimate just clears it. Reset the displayed meter/power synchronously when arming. Miss advice must distinguish a reachable timing opportunity from a build limitation. Suggest a useful experiment without silently choosing or purchasing a part.
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
| Catalog, assembly, seeded part traits, fitting, previews | `parts.js`, `builder.js`, `build-plan.js`, `rocket-art.js`, `part-insights.js`, `rocket-insights.js` |
| Expedition state, stock, rewards, save migration | `expeditions.js`, `launch-funding.js` |
| Worlds, versioned conditions, milestone map, travel | `worlds.js`, `journey.js`, `travel.js`, `world-scenery.js` |
| Starting-build screen and equipment summaries | `expedition-ui.js`, `kit-details.js` |
| Permanent research mechanics and lab UI | `research.js`, `research-ui.js` |
| Timing ratings, miss explanations, progress headlines | `launch-feedback.js`, `flight-feedback.js` |
| Persistent statistics, mission collection, and records display | `flight-records.js`, `journey-records-ui.js`, `mission-journal.js`, `mission-journal-ui.js` |
| Educational facts and optional world guide | `science-data.js`, `science-ui.js` |
| Roguelite abilities, contracts, stock, carryover, save guard | `experimental.js`, `missions.js`, `prototype-run.js`, `campaign-save.js`; integration in the existing builder, engine, and UI |

Keep new domain logic independent of DOM/storage where practical. Avoid circular imports. The builder estimates flights through the same physics used by gameplay.

## Saves and balance

- Storage keys: `rocket-away-program-v1` and `rocket-away-expeditions-v1`. Saves are per browser and origin; local and hosted games have separate progress. Reset only this game's keys in production code.
- Do not rename storage keys or discard old saves to simplify a change. Preserve migration, interrupted-flight quality, one-time rewards, research, and records. An expedition resumed after reload restarts ignition with its saved build and timing.
- Original-campaign flight/balance conditions are version **3**. Existing v0/v1/v2 expeditions retain their original physics, targets, stock rules, and earnings. Pass a run's `conditionsVersion` through condition/goal lookups. New original-campaign runs use version 3; roguelite runs use version 4.
- Prototype sessions use `prototypeVersion: 5` (versions 1/2/3/4 migrate without changing their flights, mission pairs, or equipment pools; older builds reject version 5 instead of discarding funding or flight logs), run/program `rulesVersion: 1`, and conditions version **4** without changing the default `CONDITIONS_VERSION`. Preserve all v0–v3 behavior. Future unsupported saves must remain untouched; the export recovery UI must not persist a replacement session. Both campaigns use the existing expedition key. `campaign-save.js` writes a version 1 campaign envelope with the roguelite at the root and preserved original data under `originalCampaign`. Validate both campaigns before writing; switching must preserve interrupted flights, research, and records. Older original-campaign world and kit unlocks are imported once (`progressImportVersion`), preserving that original save. `pendingWorld` can offer a later launchpad while retaining the current rocket; an interrupted flight must resume first. Reset entire game resets both campaigns.
- `node checks/prototype-audit.js` samples five seeds, three kits, ranks 0/5, and Earth/Moon starts. Its contract policy can refit for earnings and use perfect timing when sufficient. With mission variety, results were 60/60 completions, with full Earth–Moon runs taking 4–8 launches; the proposed longer-session target is not yet achieved or human-validated.
- `node checks/equipment-audit.js` exhausts affordable 120%-power openings across five seeds, three kits, nine worlds and ranks 0/5. Equipment v1/v2 comparison: 30/270 versus 14/270 possible first-launch clears; at rank 5, 25/135 versus 11/135. These are optimal opening possibilities, distinct from the earned-play policy.
- `node checks/roguelite-journey-audit.js` checks 210 later-world starts across five seeds, three kits, and ranks 0/5, using exhaustive affordable loadouts at each refit. Initial results: 210 completions and zero first-launch clears under this sampled policy. `tests/next-world.test.js` includes six earned full journeys. These are simulations, not player telemetry.
- Balance changes must test optimal affordable purchases and fully researched starts as well as normal play. Do not add arbitrary milestone caps, mandatory launch counts, or goals that rise when the player buys research.
- `node checks/balance-audit.js` exhausts affordable opening builds across five seeds, three kits, and nine worlds at maximum research and perfect timing. The v2/v3 comparison was 65/135 versus 10/135 possible first-launch world clears. Five remaining cases were Earth replays. These are simulated possibilities, not player telemetry.
- Use `tests/world-progression.test.js` to check earned full journeys, save compatibility, and world-specific choices. See README for current milestone targets, world funding, and research effects.

## Verification

1. Run `npm test` for relevant mechanics/persistence changes. It uses Node's built-in test runner, with no dependency installation needed.
2. Run appropriate `checks/*.playwright.js` in a **new, uniquely named isolated browser session**. These scripts deliberately seed or clear that session's storage. Never attach them to a player's browser.
3. Check phones at 320×568, 375×667, and 390×844; landscape at 667×375 and 844×390; and desktop at 1366×768 when layout is affected. Also check intermediate phone heights (including 390×720, 390×740, and 414×736), which expose browser-toolbar and panel-height failures. The hangar uses its actual panel height to arrange section controls. Check readable text, overlap, tap targets, and essential actions as well as overflow bounds. Inspect screenshots for visual changes.
4. Inspect the CLI's `### Result` / `### Error` output: a script assertion may be reported despite a zero shell exit code. Check browser console errors. Save temporary scripts, browser configuration, logs, and screenshots outside tracked files; close only the test session you opened.
5. Run `git diff --check` and review the staged diff. Do not rerun unrelated checks once they pass unless new changes or failures justify it.

Typical CLI use, with an externally stored `--config` if the installed browser needs one:

```sh
playwright-cli -s=rocketaway-review open http://127.0.0.1:4173/
playwright-cli -s=rocketaway-review run-code "$(cat checks/polish.playwright.js)"
playwright-cli -s=rocketaway-review close
```

Useful browser checks:

- `build-plan.playwright.js`: complete-build quotes, multi-part previews/fitting, discard, reload, fitted-launch safety, reduced motion, thirteen viewport layouts, direct rocket-body selection and an actual flight.
- `build-experience.playwright.js`: six-size combination warnings, flight logs, funded setup, actual first-flight funding, and reload/menu recovery. `launch-funding-audit.js` compares 210 optimal later-world openings with/without the pending contribution (7/210 possible clears in both; all at rank 5).

- `equipment.playwright.js`: new ability previews/fitting, six hangar/flight/report layouts, ramp feedback clear of the rocket, pause/resume, real combination flights, and recovery/contract/survey earnings.
- `mission-journal.playwright.js`: new mission selection, collection and winning builds, six journal layouts, resumed real flight, and once-only rewards.
- `prototype.playwright.js` and `prototype-journey.playwright.js`: run only on port 4174 in an isolated session. Cover experimental previews, reservation, contracts, ability flight parity, saved travel, unsupported-save protection, and earned UI progression. Keep these separate from default-game fixtures.

- `next-world.playwright.js`: old Moon save migration, Mars/Ceres defaults, replay choices, saved-rocket recovery, original unlock import, six setup layouts, and Tau Ceti ending.
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
- Modules and CSS use query-string cache versions. Update the entry-point URLs and affected transitive import graph coherently when deploying changed code; avoid mixing revisions of shared modules. JavaScript currently uses `v=workbench-1` and CSS uses `v=workbench-mobile-1`; the cartoon's independent `v=2` is intentional.
- Push the validated commit to `main`, then confirm Pages built that commit with `gh api repos/georgemclaughlin/rocketaway/pages/builds/latest --jq '{status,commit}'`. For game changes, run an isolated live-site smoke check and give the user the public game link. A documentation-only change does not require replaying the game.

## Remaining design opportunity

The roguelite route reaches Tau Ceti. Optional replay now has mission stamps, kit badges, and per-world winning rocket records. The equipment pass adds three interacting parts and companion offers. Longer carried expedition groups and discovery unlocks still need design and playtesting. Preserve the focused mobile hangar and keep collection goals optional.
