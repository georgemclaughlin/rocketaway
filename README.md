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

## Road to Tau Ceti

Fresh games open on **Earth**, the first world on the **Road to Tau Ceti**. Choose a starting rocket, then follow **hangar → launch → results → the same hangar**. There are no module drafts or route selections between flights. Existing saves resume their chosen mode; **☰ → Road to Tau Ceti** returns from Free Flight. Each mode keeps its own rocket and credits.

- **An altitude ladder, not six separate missions.** Standard milestones are 2.5, 10, 25, 55, 100, and 160 km. Every milestone passed in a flight counts and pays once. For example, reaching 13 km clears the first two and makes 25 km the next goal.
- **Three misses end the run.** A flight below the next goal uses one miss but still earns credits. Both success and failure return directly to your rocket. Its parts stay fitted, earnings are ready to spend, and the next goal stays visible.
- **Variation lives in the parts.** Each paid part gets a fixed bonus for that run: lighter construction, extra thrust, longer burn, lower drag, more research pay, or stronger boosters. The selector shows the bonus; it affects physics only while that part is fitted. Bonuses never reroll or change on an owned part.
- **Useful shop offers.** Stock refreshes after each flight and higher tiers open as you clear milestones. Each category keeps its cheapest available unowned upgrade in stock, plus a varying second offer. Owned parts always refit for free. Previewing a part leaves the equipped rocket and its main estimate unchanged.
- **Travel through real worlds.** The route is **Earth → Moon → Mars → Ceres → Europa → Titan → Triton → Pluto → Eris → Tau Ceti**. Clear all six milestones on a world to unlock the next launchpad. Each world has its own sky, terrain palette, and departure target; airless worlds have dark skies without cloud banks. The world strip shows names, cleared stops, and the current selection. Unlocked worlds can be replayed.
- **A departure worth celebrating.** A winning report offers **Travel to [destination]**. Your assembled rocket flies between the two worlds in a short starfield animation, then opens the next world's build screen. Travel can be skipped or dismissed with Escape; reduced-motion mode uses a brief static arrival. Results and unlocks are saved before travel, so refreshing cannot lose progress or award it twice.
- **Fresh builds, continuous progress.** Milestones unlock Stagehand and Scientist starting rockets. Each world starts with fresh parts and credits; unlocked worlds, starting builds, and journey completion persist. The next-world screen explains its departure goal and offers illustrated builds with starting credits. **Build rocket** goes directly to the hangar. Three misses end only the current attempt; retry that world with your unlocks intact.
- **Reach another star.** Completing Eris opens the final travel sequence to **Tau Ceti**, marks the journey complete, and leaves all nine worlds available to replay. Tau Ceti is the stellar destination, not a surface you land on.

A persistent journey map stays above the hangar and flight: all six milestones, checkmarks for those reached, a highlighted next milestone, the departure altitude, and your world number. The heading identifies the current world, next destination, and position among the nine launch worlds. Named altitude stops make each target part of the same climb. The map updates as milestones are crossed in flight and retains completed stops after a miss.

The report shows how the flight moved your journey forward (for example, **0 → 2 of 6**) and separates what this flight cleared from the next goal. It includes actual launch power; the hangar keeps a short last-flight receipt. Estimates use 110% launch power. When a stronger launch can bridge a shortfall, the hangar says **Aim for gold**.

Parts and stock are seeded and saved. Reloading cannot reroll them. Reloading during a flight offers **Resume flight**, restarting at ignition with the saved rocket and launch timing. Results pay once; reloading after a completed flight returns to the hangar with the receipt. Once the goal is reached, **See result** fast-forwards to the final altitude and credits every crossed milestone. **Back** or Escape cancels ignition timing without using a miss.

In the menu, **End expedition** asks for confirmation. **Free Flight** lets you leave a run and return later. Opening the menu during a flight pauses it until the menu closes.

## Permanent research

**Research** is a large button beside **Launch rocket** in the hangar and **Build rocket** on the world screen. It shows your research point balance and an **Upgrade available** cue when you can afford an upgrade. Research is also available in the menu. **Research points** buy permanent upgrades; **credits** buy parts for the current rocket. No research screen is forced between flights.

Each completed expedition flight earns 1 research point, plus 2 per milestone cleared that flight and 4 for clearing a world for the first time. Even a miss earns a point. Ending a run manually does not. Rewards are settled once and remain through losses, world changes, and browser reloads.

The lab highlights your current rocket and shows one next upgrade at a time, with before-and-after stats, its price, and the points you will have left. Starter parts are labeled for future rockets.

Each starting build has five permanent research ranks, costing 3, 5, 8, 12, and 18 research points. Spend on one specialization or spread research across the builds you use. Stagehand and Scientist research opens with the corresponding starting build.

| Build | Bonus per rank | Better starting parts |
| --- | --- | --- |
| Scrapper | 3% less dry weight; 10 more starting credits | Rank 2: Ember; rank 4: Dart; rank 5: Needle |
| Stagehand | 6% more booster kick | Rank 2: Long tank; rank 3: Ember; rank 4: Solid boosters; rank 5: Composite tank |
| Scientist | 3% longer burn; 5% more altitude pay | Rank 2: Long tank; rank 4: Composite tank; rank 5: Dart |

Bonuses are additive across ranks and apply only when flying that build. A purchase updates the current matching rocket’s physics and estimates immediately. Starting credits and parts apply when the next rocket is created, so research never overwrites fitted parts mid-run. The starting-build illustrations and rank labels reflect those permanent unlocks. Higher-tier starting parts replace the earlier part in the same slot, while earlier unlocked parts remain owned for free refitting.

Existing saves receive a one-time research balance of 2 research points per recorded milestone plus 4 per recorded win. Reloading does not repeat this grant. **Reset entire game** also clears research; ending a single expedition keeps it. Free Flight keeps its existing progression and is unaffected.

## Free Flight: build and fly

1. Select **☰ → Free Flight**. In the hangar, select the nose cone, fuel tank, engine, or side boosters using the labeled rocket sections.
2. Tap a part thumbnail in the selector. All four parts in that category are visible, with prices and **Fitted** / **Owned** labels. The rocket drawing, section labels, and main height estimate always describe your equipped rocket. A candidate’s **With this part** comparison stays inside the selector; browsing does not spend credits or change your rocket. **Info** opens the full description and statistics.
3. Compare the estimated flight height against your current rocket. The estimate simulates a flight at **110% launch power**; actual timing changes the result. Larger tanks add fuel and weight, engines affect lift and efficiency, and nose cones reduce drag or carry science instruments.
4. Choose **Buy & fit**, or **Fit part · free** for something you already own. The rocket changes visually. Side boosters fire and detach automatically during flight.
5. Tap **Launch rocket**, then **Launch!** in the gold zone. There are no flight-plan settings or random event choices. Your assembly determines the flight.
6. Collect the flight grant, altitude pay, milestone rewards, and any completed contract. **Improve rocket** returns to the hangar.
The first mission is **100 km**, the edge of space. Reaching it unlocks a **200 km** mission without resetting your rocket or inventory. Contracts reward precise launches, altitude, coasting, a science capsule, and side boosters. The rocket visibly reflects its parts; empty booster stages detach during flight. Altitude zones, a previous-best marker, and record celebrations mark your progress.

**Speed ×1 / ×3** fast-forwards flights. **P / Escape** pauses or resumes. Switching away pauses active flights. Sound is optional and starts muted. Motion effects respect reduced-motion preferences.

The destinations are real, but the launch bases, route, growing altitude targets (5% per world), and compressed interstellar travel are arcade fiction. These are arcade physics, not an orbital simulation. Component masses, fuel consumption, engine efficiency, drag, and staging affect the flight, but there is no manual steering or orbital maneuvering.

## Saved progress and reset

Credits, parts owned and fitted, contracts, milestones, best altitude, and flight count save in this browser when storage is available. Progress is per browser/device. Reloading during a Free Flight launch abandons it without paying rewards. Expeditions are saved separately, including the launch timing needed to resume an interrupted flight.

Older expedition saves keep their rocket, credits, and earned bonuses. Their former Ascent level maps directly to the corresponding world; previously unlocked levels become unlocked worlds. Pending module/route selections become a ready hangar. Previously flown milestones are credited once during migration. Already-earned legacy bonuses remain active for that run and can be inspected in the menu; new runs use physical part bonuses instead.

Older upgrade-based saves retain credits, altitude, and milestones. Their upgrade levels unlock corresponding owned components automatically. Previous flight-plan and event settings are no longer used; flights use the same baseline tuning for consistent part comparisons.

To start completely over, select **☰ → Reset entire game**, then confirm **Reset entire game**. This clears both modes: Free Flight credits, parts, records, and contracts, plus the current expedition, unlocked worlds and starting builds, discoveries, and run history. **Keep playing** or Escape cancels without changing either save. Only this game’s two save entries are reset; other browser data is untouched.

## Files and checks

No build step, dependency installation, external assets, API keys, or backend are needed. All asset paths are relative for GitHub Pages repository subpaths.

- `index.html` — launchpad, visual hangar, part selector, reports, and reset dialog.
- `style.css` — viewport-based layout for desktop, phones, and landscape.
- `game.js` — canvas artwork, assembly hit targets, input, audio, UI, and persistence.
- `builder.js` — part thumbnails, equipped assembly, upgrade comparisons, and height estimates.
- `parts.js` — component catalog, run-specific part bonuses, inventory, fitting, and assembly statistics.
- `expeditions.js` — seeded runs, altitude milestones, stock, rewards, progression, and save migration.
- `expedition-ui.js` — world selection, starting rockets, and saved-flight recovery.
- `worlds.js` — real-world route, scenery palettes, destination names, and progression strip.
- `travel.js` — skippable, reduced-motion-aware travel celebration.
- `research.js` — permanent research economy, rank effects, starting blueprints, and migration.
- `research-ui.js` — optional research lab and purchase feedback.
- `journey.js` — the shared milestone map, named stops, and live journey progress.
- `modifiers.js` — legacy module/route effects retained for existing saves.
- `engine.js` — flight physics, contracts, milestones, and save migration; legacy simulation helpers remain for regression checks.
- `tests/` — mechanics, parts, persistence, reward integrity, and full campaign tests.
- `checks/journey.playwright.js` — repeatable browser checks for world setup, real flight completion, travel, save integrity, phone layouts, and reduced motion.

Run `npm test` (Node 18+). There are no npm dependencies. Playwright CLI is used for browser checks of layout, real touch input, uninterrupted flights, previewing/buying/refitting parts, complete progression, and reset behavior.

With Playwright CLI installed and the local server running, use a fresh named browser session for the journey checks. These checks seed and reset game saves **inside that test session**:

```sh
playwright-cli -s=rocketaway-tests open http://127.0.0.1:4173
playwright-cli -s=rocketaway-tests run-code --filename=checks/journey.playwright.js
playwright-cli -s=rocketaway-tests run-code --filename=checks/research.playwright.js
playwright-cli -s=rocketaway-tests close
```

The core game rules stay in pure modules tested by Node; browser checks cover their connection to the interface. A UI framework is not required for either test layer.

## GitHub Pages

The live game is hosted at [georgemclaughlin.github.io/rocketaway](https://georgemclaughlin.github.io/rocketaway/). GitHub Pages serves the root of the `main` branch. The root `index.html` is the entry point; `.nojekyll` keeps publishing static. The files also work on any static web host.

Progress is stored only in the player’s browser. The game has no analytics or external services. Saves are separate for each site address and do not transfer automatically from a local preview to the hosted game.

Rocket and world scenes use canvas and CSS. The pilot uses a bundled transparent illustration in `assets/astronaut-cartoon.png`, generated with the built-in image-generation tool. Only the finished artwork is included. Audio is synthesized locally.

## Astronomy references

World names and scene inspiration use real Solar System destinations; [NASA’s Solar System overview](https://science.nasa.gov/solar-system/) and [Titan facts](https://science.nasa.gov/saturn/moons/titan/facts/) provide background. Tau Ceti is the real stellar destination. No speculative planet is presented as a known landing site: the [NASA Exoplanet Archive entry for Tau Ceti](https://exoplanetarchive.ipac.caltech.edu/overview/tau%20cet) currently marks Tau Ceti e as refuted and flags other listed planets as controversial.
