# Rocket Away

A small rocket-building game: buy components, assemble a rocket, and launch it toward space. Inspired by classic browser launch games and the build–test–iterate idea of a spacecraft builder. Flights are automatic. Choose actual rocket parts, compare upgrades, and test your build.

[Play Rocket Away](https://georgemclaughlin.github.io/rocketaway/)

## Play locally

```sh
npm start
```

Or, without Node:

```sh
python3 -m http.server 4173 --bind 0.0.0.0
```

Open **http://127.0.0.1:4173** on this computer. A phone on the same Wi-Fi can use `http://<your-computer-LAN-IP>:4173`. An HTTP server is needed for JavaScript modules.

The game fits the viewport and shows one phase at a time on phones and desktop. The hangar is home between launches; launch timing and flight take over the screen. The **☰ menu** holds mode switching, sound, ending a run, and resetting the game.

## Expeditions: repeatable runs

Fresh games open in **Expeditions**. Choose a starting rocket, then follow **hangar → launch → results → the same hangar**. There are no module drafts or route selections between flights. Existing saves resume their chosen mode; **☰ → Expeditions** returns from Free Flight. Each mode keeps its own rocket and credits.

- **An altitude ladder, not six separate missions.** Standard milestones are 2.5, 10, 25, 55, 100, and 160 km. Every milestone passed in a flight counts and pays once. For example, reaching 13 km clears the first two and makes 25 km the next goal.
- **Three misses end the run.** A flight below the next goal uses one miss but still earns credits. Both success and failure return directly to your rocket. Its parts stay fitted, earnings are ready to spend, and the next goal stays visible.
- **Variation lives in the parts.** Each paid part gets a fixed bonus for that run: lighter construction, extra thrust, longer burn, lower drag, more research pay, or stronger boosters. The selector shows the bonus; it affects physics only while that part is fitted. Bonuses never reroll or change on an owned part.
- **Useful shop offers.** Stock refreshes after each flight and higher tiers open as you clear milestones. Each category keeps its cheapest available unowned upgrade in stock, plus a varying second offer. Owned parts always refit for free. Previewing a part leaves the equipped rocket and its main estimate unchanged.
- **Start again with a different build.** Milestones unlock Stagehand and Scientist starting rockets. Wins unlock the next Ascent, up to nine levels, each adding 5% of the standard altitude goals. Kits, unlocked difficulty, and history persist; rocket parts and credits start fresh each run. After finishing, the next expedition setup focuses on the new journey: its finish altitude, first target, and illustrated starting builds. Each build shows its advantage and starting credits. The **Finish line** selector lets you replay a goal or try a higher one. **Build this rocket** starts a fresh run in the hangar; unlocked builds and goals stay yours.

A persistent journey map stays above the hangar and flight: all six milestones, checkmarks for those reached, a highlighted next milestone, a reached count, and the final finish altitude. Named stops make each target part of the same climb. The map updates as milestones are crossed in flight and retains completed stops after a miss.

The report shows how the flight moved your journey forward (for example, **0 → 2 of 6**) and separates what this flight cleared from the next goal. It includes actual launch power; the hangar keeps a short last-flight receipt. Estimates use 110% launch power. When a stronger launch can bridge a shortfall, the hangar says **Aim for gold**.

Parts and stock are seeded and saved. Reloading cannot reroll them. Reloading during a flight offers **Resume flight**, restarting at ignition with the saved rocket and launch timing. Results pay once; reloading after a completed flight returns to the hangar with the receipt. Once the goal is reached, **See result** fast-forwards to the final altitude and credits every crossed milestone. **Back** or Escape cancels ignition timing without using a miss.

In the menu, **End expedition** asks for confirmation. **Free Flight** lets you leave a run and return later. Opening the menu during a flight pauses it until the menu closes.

## Free Flight: build and fly

1. Select **☰ → Free Flight**. In the hangar, select the nose cone, fuel tank, engine, or side boosters using the labeled rocket sections.
2. Tap a part thumbnail in the selector. All four parts in that category are visible, with prices and **Fitted** / **Owned** labels. The rocket drawing, section labels, and main height estimate always describe your equipped rocket. A candidate’s **With this part** comparison stays inside the selector; browsing does not spend credits or change your rocket. **Info** opens the full description and statistics.
3. Compare the estimated flight height against your current rocket. The estimate simulates a flight at **110% launch power**; actual timing changes the result. Larger tanks add fuel and weight, engines affect lift and efficiency, and nose cones reduce drag or carry science instruments.
4. Choose **Buy & fit**, or **Fit part · free** for something you already own. The rocket changes visually. Side boosters fire and detach automatically during flight.
5. Tap **Launch rocket**, then **Launch!** in the gold zone. There are no flight-plan settings or random event choices. Your assembly determines the flight.
6. Collect the flight grant, altitude pay, milestone rewards, and any completed contract. **Improve rocket** returns to the hangar.
The first mission is **100 km**, the edge of space. Reaching it unlocks a **200 km** mission without resetting your rocket or inventory. Contracts reward precise launches, altitude, coasting, a science capsule, and side boosters. The rocket visibly reflects its parts; empty booster stages detach during flight. Altitude zones, a previous-best marker, and record celebrations mark your progress.

**Speed ×1 / ×3** fast-forwards flights. **P / Escape** pauses or resumes. Switching away pauses active flights. Sound is optional and starts muted. Motion effects respect reduced-motion preferences.

These are arcade physics, not an orbital simulation. Component masses, fuel consumption, engine efficiency, drag, and staging affect the flight, but there is no manual steering or orbital maneuvering.

## Saved progress and reset

Credits, parts owned and fitted, contracts, milestones, best altitude, and flight count save in this browser when storage is available. Progress is per browser/device. Reloading during a Free Flight launch abandons it without paying rewards. Expeditions are saved separately, including the launch timing needed to resume an interrupted flight.

Older expedition saves keep their rocket, credits, and earned bonuses. Pending module/route selections become a ready hangar. Previously flown milestones are credited once during migration. Already-earned legacy bonuses remain active for that run and can be inspected in the menu; new runs use physical part bonuses instead.

Older upgrade-based saves retain credits, altitude, and milestones. Their upgrade levels unlock corresponding owned components automatically. Previous flight-plan and event settings are no longer used; flights use the same baseline tuning for consistent part comparisons.

To start completely over, select **☰ → Reset entire game**, then confirm **Reset entire game**. This clears both modes: Free Flight credits, parts, records, and contracts, plus the current expedition, unlocked kits and difficulty levels, discoveries, and run history. **Keep playing** or Escape cancels without changing either save. Only this game’s two save entries are reset; other browser data is untouched.

## Files and checks

No build step, dependency installation, external assets, API keys, or backend are needed. All asset paths are relative for GitHub Pages repository subpaths.

- `index.html` — launchpad, visual hangar, part selector, reports, and reset dialog.
- `style.css` — viewport-based layout for desktop, phones, and landscape.
- `game.js` — canvas artwork, assembly hit targets, input, audio, UI, and persistence.
- `builder.js` — part thumbnails, equipped assembly, upgrade comparisons, and height estimates.
- `parts.js` — component catalog, run-specific part bonuses, inventory, fitting, and assembly statistics.
- `expeditions.js` — seeded runs, altitude milestones, stock, rewards, progression, and save migration.
- `expedition-ui.js` — starting rockets, difficulty selection, and saved-flight recovery.
- `journey.js` — the shared milestone map, named stops, and live journey progress.
- `modifiers.js` — legacy module/route effects retained for existing saves.
- `engine.js` — flight physics, contracts, milestones, and save migration; legacy simulation helpers remain for regression checks.
- `tests/` — mechanics, parts, persistence, reward integrity, and full campaign tests.

Run `npm test` (Node 18+). There are no npm dependencies. Playwright CLI is used for browser checks of layout, real touch input, uninterrupted flights, previewing/buying/refitting parts, complete progression, and reset behavior.

## GitHub Pages

The live game is hosted at [georgemclaughlin.github.io/rocketaway](https://georgemclaughlin.github.io/rocketaway/). GitHub Pages serves the root of the `main` branch. The root `index.html` is the entry point; `.nojekyll` keeps publishing static. The files also work on any static web host.

Progress is stored only in the player’s browser. The game has no analytics or external services. Saves are separate for each site address and do not transfer automatically from a local preview to the hosted game.

Artwork is drawn with canvas, and audio is synthesized locally.
