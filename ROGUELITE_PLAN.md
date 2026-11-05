# Rocket Away roguelite design and implementation plan

Status: The public roguelite now continues past Moon through the existing nine-world route to Tau Ceti, with next-world selection fixed at the owner’s request. The original campaign is preserved separately and accessible from the menu. Phases 1–3 have a playable first implementation and automated coverage. Phase 4 remains open for human feedback and pacing revisions; the grouped three-world expeditions and expanded research below remain proposed.

## Current implementation findings

Moon completion now unlocks Mars, and later worlds use fresh funded rockets with their existing targets plus experimental parts and two equipment contracts. Setup defaults to the furthest unlocked world; replay is explicit. Older Moon-complete saves upgrade without repeating rewards. Original-campaign world/kit unlocks are recognised once while the original save and any interrupted rocket remain preserved. The later-world audit completed 210/210 sampled starts across five seeds, three kits, and research ranks 0/5; six earned full journeys also pass. Grouped carryover beyond Earth–Moon is not yet implemented.

The current journey includes nine experimental parts (the initial six plus Momentum, Drop, and Return), two optional contracts per world, one reservable shop offer, carried equipment and credits, shared misses, Moon checkpoint funding, a permanent journal, and protected save/resume. New attempts favor available companion equipment in one special-offer slot. Exact initial specifications and local play instructions are in [README](README.md#roguelite-journey), with source constants in [experimental.js](experimental.js) and [prototype-run.js](prototype-run.js).

The sampled earned-build audit completes 60/60 cases across five seeds, three kits, ranks 0/5, and Earth/Moon starts. Its policy uses contracts and perfect timing where useful. Full Earth–Moon cases take 4–8 launches, median 6. This does not establish the planned session duration: carrying an already developed rocket can make the Moon brief. Next evaluate actual player choices and consider additional distinct equipment opportunities or objectives before increasing targets. No human enjoyment result is claimed.

The initial prototype uses one separation event, fixed experimental abilities, and existing research. The owner-requested next increment implements mission variety, kit badges, and winning-rocket records as described at the end of this plan. Catalog research extensions and longer expedition groups remain deferred pending further playtesting. Public rollout preserves the original save inside the campaign envelope. It now opens by default publicly; the original campaign is kept separately in the existing save envelope, with menu switching between campaigns.

## Direction

Turn Rocket Away into a rocket-building roguelite with longer expeditions, interacting equipment, and decisions that change between attempts. The player should discover a promising combination, invest in it, adapt it to another world, and have a reason to try a different design after the expedition ends.

The recommended destination is an expedition spanning several worlds. Keep the accessible core of choosing parts and watching an automatic flight, while giving each rocket enough time to develop an identity. Additional playtime should come from building, adapting, taking optional risks, and recovering from setbacks.

The first implementation should be a local Earth–Moon prototype. It must demonstrate more enjoyable decisions before expanding the campaign or adding a large equipment catalog. All numerical targets and effect strengths below are hypotheses to tune through that prototype.

## What needs to improve

The existing game has seeded stock, three starting kits, permanent research, cumulative milestones, reliable flight previews, and a complete journey. These are useful foundations. The main design limitations are:

- Altitude dominates most purchasing decisions. A higher estimate usually identifies the immediate answer.
- Many part bonuses improve one statistic without changing how the player builds.
- A new world discards the developed rocket, limiting the time available to enjoy a combination.
- Several outer worlds ask similar questions of the same small catalog.
- Research can finish for a preferred kit well before the campaign ends.
- Failure and optional replay offer little guidance toward a different strategy.

During the initial review, one simulated Scrapper campaign completed all nine worlds using a simple height-improvement purchase policy, reached maximum Scrapper research by Mars, and used the same purchase sequence on Triton and Pluto. This is a design warning from one simulation, not a measurement of typical player behavior.

Relevant existing systems: [parts](parts.js), [expeditions](expeditions.js), [research](research.js), [world conditions](worlds.js), and [earned progression tests](tests/world-progression.test.js).

## Expedition structure and session length

### Compare the options

| Structure | Benefits | Main cost | Decision |
| --- | --- | --- | --- |
| One world per attempt | Small scope, quick retries, close to the existing game | Little time to develop a combination; longer play requires substantially richer objectives within each world | Use as a comparison during prototype testing |
| Several worlds per expedition | A rocket develops over time and must adapt to changing conditions | Requires carried equipment, new economy rules, and clear retry boundaries | Recommended campaign structure |
| Entire nine-world journey per attempt | Strong continuity and a large final payoff | Long losses, difficult balance, and a substantial commitment before another fresh build | Defer |

### Recommended campaign structure

Organize the existing route into three expeditions:

1. Earth → Moon → Mars, ending with departure for Ceres.
2. Ceres → Europa → Titan, ending with departure for Triton.
3. Triton → Pluto → Eris, ending with the crossing to Tau Ceti.

Within an expedition, retain owned parts, fitted equipment, credits, and temporary experimental equipment when traveling to the next world. Arrival opens the hangar with a clear conditions comparison and an opportunity to refit. A new expedition starts a new rocket and budget. Permanent research and world unlocks survive both outcomes.

Initial pacing hypothesis: approximately 12–18 launches and 20–35 minutes for a full three-world expedition, including decisions and reports. Three successful expeditions would therefore offer roughly 60–105 minutes of campaign play before retries and optional challenges. These are playtest targets, not launch requirements. Strong builds may finish sooner and may clear every altitude milestone they cross.

Save after every consequential choice and completed flight. A player can leave after any refit and continue later; a longer expedition must not require an uninterrupted session. Resume interrupted flights from ignition with their saved configuration and timing, as today.

### Failure and checkpoints

The initial candidate retains a budget of three misses for the expedition. Crossing to another world does not silently refill it. The UI must state that the miss budget spans the expedition, and playtesting must establish whether this produces engaging tension or excessive caution.

World access remains permanent. After failure, offer two clearly labeled choices: rebuild from the latest unlocked launchpad, or start the full expedition again. A later-world start is a shorter expedition with a fresh, explicitly funded build; it does not restore the failed rocket. Completing it can advance the campaign. Full-expedition challenge records require the full route and are tracked separately.

This makes restarting a long build optional while preserving a reason to attempt the complete sequence. Funding for later-world starts must be balanced separately against carried builds, using fixed world targets. Do not punish a fresh checkpoint start with goals designed only for a fully developed carried rocket.

If three misses across several worlds discourages experimentation, evaluate a clearly advertised recovery opportunity at a world transition. Change this rule deliberately after observing play; avoid hidden forgiveness or arbitrary difficulty scaling.

## Meaningful choices during a run

Every launch should have an understandable purpose: progress toward departure, complete an optional objective, test a newly fitted combination, or recover from a miss by changing the build.

The player encounters four kinds of decisions:

- **Investment:** buy immediate performance, save for a pivotal part, or accept lower performance for future earnings.
- **Combination:** choose equipment that works together, including reasons to retain a cheap part.
- **Adaptation:** change the rocket for the next world's conditions or mission requirements.
- **Risk:** take an optional contract that rewards a constrained build, with its requirements visible before ignition.

Keep accurate estimates. The design should remain interesting when the player knows the predicted altitude. Add mission readiness, active effects, and earnings information where relevant; uncertainty about shop opportunities can supply surprise without secretly randomizing flight outcomes.

## Equipment and build families

### Small initial catalog

Prototype six experimental parts across three families. Use the existing nose, tank, engine, and booster slots. Each experimental part has one distinctive ability, a visible drawback, and a stable identity. Equipping a part makes its ability active; simply owning it does not.

The names below are working names. Exact mass, price, magnitude, and duration are Phase 1 tuning work, to be recorded before player testing.

| Family | Experimental part | Ability | Tradeoff and decision |
| --- | --- | --- | --- |
| Staging | Reserve tank | Carries a finite reserve that becomes usable at booster separation | Additional launch mass; reserve is inaccessible without fitted boosters |
| Staging | Separation engine | Receives one temporary thrust increase after booster separation | Weaker baseline performance; benefits from fuel remaining after separation |
| Lightweight | Feather shell | Improves performance while the ignition build meets a displayed wet-mass limit | Less useful with heavy equipment; adding a large tank can disable the ability |
| Lightweight | Endurance engine | Gains burn efficiency when no boosters are fitted | Lower initial thrust; the player gives up staging combinations |
| Science and economy | Survey capsule | Adds credits for newly earned altitude milestones while fitted | Added payload mass; ordinary milestone and research rewards remain distinct |
| Science and economy | Instrument engine | Burns more efficiently with a science capsule fitted | Lower standalone thrust; commits an engine slot to a payload strategy |

All are explicitly arcade equipment. Reserve fuel must be accounted for as carried mass; an empty discarded booster does not create fuel. The engine currently has one automatic booster separation. The first prototype uses that single event and does not imply a multistage system already exists.

Each family needs a useful partial build and a stronger combination. An unavailable partner must not turn a purchased part into an unavoidable loss. Families remain usable across starting kits, while kit research supplies a preference rather than an exclusive requirement.

Use fixed, cataloged experimental variants with stable IDs and their own prices and specifications. For the first prototype, an experimental variant's ability replaces the ordinary random stat trait on that item. Do not stack another random rarity or affix layer onto it. Standard parts retain their existing traits.

### How combinations develop

An example staging expedition begins with affordable boosters, finds a reserve tank, and later chooses a separation engine. The next purchase might be a lighter nose to compensate for reserve mass, or a conventional engine that performs better in a particular atmosphere. Finding the pair should create an advantage, while refitting away from it remains a reasonable choice.

A science expedition can accept a heavier capsule to fund later purchases, then use an instrument engine to offset its cost in altitude. Buying the capsule just before departure should be less attractive than investing early. The economic benefit applies only to newly earned milestones, preventing repeated flights from farming the same experimental reward.

## Stock and randomness

Retain dependable standard upgrades in every category. Add at most two experimental offers to a refresh, surfaced within the existing part browser. The initial hangar should offer an affordable, useful entry into at least one family. By the first successful refit, the player should have seen enough information to form a strategy.

Generate offers deterministically from a saved seed and offer index. Persist the generated offers, item identities, and purchase state. Reloading, previewing, opening a dialog, and Fast Forward must not advance shop randomness. Resolve a refresh once per completed flight, including resumed flights.

Allow the player to reserve one unowned experimental offer through future refreshes at no charge. Reserving does not purchase or equip it. The reserved offer occupies one experimental slot, leaving standard progression available. Owned equipment remains free to refit. There is no resale system in the prototype.

Use bounded offer rules to avoid unusable opening equipment and excessive duplicates. Do not force a predetermined complete combination or guarantee the exact partner to every purchase. Test both constrained random offers and a small curated seed set.

Defer paid rerolls until the offer and reservation system has been tested. If the player repeatedly lacks meaningful choices, fix availability before adding a currency sink.

## Missions that give the build a purpose

Keep the six cumulative altitude milestones and the departure target for each world. Add a small number of optional, finite contracts that can be selected in the hangar. Candidate examples include carrying a science capsule to a stated altitude, clearing a target below a stated launch mass, or completing a flight without boosters.

Contracts show their objective, reward, qualifying build conditions, and miss consequence before launch. Freeze the selected contract and fitted build at ignition. A successful contract can make a flight worthwhile even when it falls below the next departure milestone.

Proposed success rule: a flight avoids a miss if it crosses a new altitude milestone or completes its selected, unfinished contract. If neither happens, it uses one miss. A completed contract cannot be selected again for rewards or miss protection. Crossing a milestone still counts even when the contract fails. No contract is required to depart.

This changes the current altitude-only definition of a miss and must be reflected in setup, launch readiness, advice, reports, and saves together. Standard milestone research rewards remain; contracts initially pay credits and a completion mark, avoiding another research-farming route.

Offer a small fixed allowance per world, initially two candidate contracts. Use them to test distinct build decisions rather than requiring additional flights. Multiple accomplishments can resolve in one launch. Audit contract pay alongside experimental earnings and the normal economy.

## Progression between expeditions

Preserve purchased research, its current benefits, unlocked kits, and both existing save keys. Prototype the equipment system with its full small catalog available to testers so research grinding does not obscure whether combinations are fun.

For the eventual campaign, add kit-specific research options that unlock equipment families or alternative starting packages. New purchases should broaden possible builds. Unlocking a catalog entry permits offers in future expeditions; it does not silently replace an equipped part or reroll an active shop. Snapshot catalog eligibility when a new expedition starts.

Keep the visible Research button and its affordable-current-kit, affordable-other-kit, and unaffordable states. Broader unlocks must fit that model. Existing rank upgrades remain valuable and are not removed to make room for the new tree.

Do not make players lose repeatedly to unlock basic competence. Each starting kit and an unresearched profile must have viable paths through the campaign. Later unlocks should not dilute essential stock: keep standard offers and experimental offers separate.

After the core is proven, preserve completed rockets in a compact collection with their parts, route, contracts, and records. Add optional full-expedition medals and per-world records. Separate checkpoint starts, full expeditions, and legacy runs so records compare meaningful achievements.

## Flight presentation and mobile interaction

Build abilities need observable effects. Show reserve activation, a changed exhaust during a thrust surge, and stage separation through brief visual and audio cues. Report actual activations and experimental earnings after the flight. Do not invent a numerical contribution for an effect unless a comparison simulation supports it.

These effects remain automatic. Preserve the single Fast Forward toggle, Pause, See result, reduced motion, and skippable travel. Skipping must retain every reward and event summary. Flight duration does not increase just to lengthen playtime.

The hangar must still fit the viewport. Use compact Standard and Experimental browsing within the selected slot rather than adding a tall permanent panel. Show an ability's condition and whether it is active in the candidate preview. Explain why a mass limit or partner requirement is unmet. Buying and fitting always require the existing explicit action.

Place contracts in a compact, optional hangar view with a small active-objective summary. Returning closes it directly to the build. Avoid a forced selection screen between launches. Show the expedition route, current world milestone, and remaining misses without competing with the rocket or launch controls.

A first-time player should encounter one understandable ability before being asked to interpret a full combination. Later arrivals should explain the change that matters to the carried rocket, such as the loss of aerodynamic benefit in vacuum.

## Variety across the longer campaign

Give each expedition a distinct learning and decision arc. Earth introduces a useful ability; the Moon tests whether the player can adapt the same rocket to vacuum; Mars tests the developed combination before the first expedition ends. Ceres and Europa can emphasize lightweight construction versus carrying heavier mission equipment, followed by Titan's existing strong drag. Triton and Pluto need contrasting optional constraints, such as booster-free delivery and a limited refit budget, before Eris provides the final departure challenge.

These mission themes are proposed arcade scenarios. Later content should introduce a small number of new behaviors or variants at expedition boundaries, with a preview of what the next expedition can offer. Avoid exposing the entire eventual catalog immediately. Keep a useful initial pool available without research so this anticipation does not become a grind requirement.

Phase 5 must test whether the outer-world objectives actually cause different builds. If two consecutive worlds repeatedly produce the same purchases and flight experience, revise their objectives or available equipment before adding further content. Distinct scenery and arrival reactions support those differences, but do not establish them by themselves.

## Existing rules and proposed changes

The current [agent guide](AGENTS.md) describes the shipped game. The following changes are design proposals and take effect only with their implementation and corresponding documentation update.

| Existing rule | Proposed rule | Reason |
| --- | --- | --- |
| Fresh rocket and budget at every world | Keep the rocket and credits within a multi-world expedition; reset at expedition start | Give a combination time to develop and require adaptation |
| Three misses end the current world attempt | Three misses initially span the expedition, with unlocked-world checkpoint starts available afterward | Add sustained stakes while keeping recovery accessible |
| A flight below the next altitude milestone is a miss | A new milestone or an unfinished selected contract can make the flight successful | Support useful flights with different goals |
| Run variation uses standard part bonuses | Add experimental physical parts with conditional abilities | Create different purchase priorities and combinations |
| Conditions version 3 for new runs | Introduce a separately versioned new expedition model after prototype validation | Preserve existing runs and support different economy and flight rules |

Keep the real-world route and Tau Ceti ending, all actually crossed milestones, permanent world unlocks, preview accuracy, automatic flight, optional replay, and reliable settlement. Preserve Free Flight and legacy modules/routes for old saves. Reusing legacy ideas does not require restoring their old forced draft screens.

## Technical implementation

### Pure domain modules

Keep the static native-module architecture. Introduce narrowly scoped modules for experimental part definitions, ability evaluation, contract rules, and expedition itinerary state. Names can follow repository conventions during implementation. DOM rendering and storage remain outside these modules.

| Area | Planned work |
| --- | --- |
| `parts.js`, `builder.js`, `part-insights.js` | Resolve standard and experimental item IDs, validate compatibility, compare active effects, and include variants in estimates |
| `engine.js`, `flight-playback.js` | Apply deterministic launch and separation effects, preserve fixed ticks, and produce a bounded event summary |
| `expeditions.js` | Own itinerary, carried inventory, offers, reservation, contracts, miss evaluation, arrivals, and one-time settlement |
| `worlds.js`, `journey.js`, `travel.js` | Distinguish expedition position from world milestones and preserve the existing travel route |
| `research.js`, `research-ui.js` | Preserve existing ranks and later expose kit-specific catalog unlocks |
| `game.js`, `index.html`, `style.css` | Render compact experimental browsing, mission selection, ability feedback, arrival, and recovery |
| Records and ending modules | Retain old totals; later add route/build summaries and distinguish record categories |

### Deterministic abilities and previews

Define an explicit order: resolve equipped parts and research; compute ignition mass and conditional abilities; initialize finite fuel and event state; simulate ticks; apply separation events once; resolve objectives; settle rewards once.

The reserve tank requires careful treatment of fuel capacity, usable fuel, and mass. Freeze the separation schedule from the initial configuration so reserve activation cannot recursively postpone separation or re-trigger itself. Thrust surges use simulated time. Conditions based on ignition mass are evaluated once, not repeatedly as fuel drains.

Use the same simulation path for the hangar estimate, normal playback, Fast Forward measurement, and See result. All simulation probes must be isolated from the live flight and expedition state. The current Fast Forward measurement uses a shallow flight copy; introducing nested ability state requires a dedicated deep clone or a proven immutable representation. Expand estimate cache keys to include all ability parameters, rules versions, fitted variants, and relevant research.

Previewing a combination or estimating its earnings must never purchase equipment, consume a contract, refresh stock, record a launch, or award credits. Keep event output bounded so a long low-gravity flight does not generate an unbounded log.

### Versioning and saves

Keep `rocket-away-program-v1` and `rocket-away-expeditions-v1`. The existing serialized session version and `conditionsVersion` describe different things; do not conflate schema migration with a balance revision.

Add an explicit expedition rules version for itinerary, stock, contracts, and ability behavior. Introduce conditions version 4 for new physics, targets, and economy where needed. Persist enough data to reconstruct an interrupted flight with the exact chosen items, ability parameters, contract, launch quality, and world conditions.

Existing v0–v3 expeditions must finish with their original single-world rules. Update the accepted version list explicitly so introducing v4 cannot cause current v3 saves to fall through to the oldest model. Enter the new campaign structure only after a legacy run ends. Preserve unlocked worlds and offer a checkpoint start at the player's existing frontier, including inside a chapter. Completed saves retain their ending and optional replay state.

Persist an arrival marker, offer index, consumed objective IDs, and reward settlement state. A refresh or reload between report and travel must not duplicate a reward, refill the miss budget, issue another arrival grant, or draw new offers. Funding at checkpoints and any transition grant must have explicit once-only rules; a carried rocket does not receive the old fresh-start budget automatically.

Validate new IDs and numeric fields on restore. Default absent additive fields safely. For a save from an unsupported newer rules version, preserve it and show a recoverable message rather than overwriting it with a new game.

## Balance and verification

### Mechanics and persistence

Run `npm test` for implementation changes and add focused coverage for:

- Every ability alone, its qualifying and nonqualifying builds, and relevant pairs.
- Reserve fuel conservation, separation exactly once, mass thresholds, and finite flight completion.
- Equal flight outcomes across frame rates, normal speed, Fast Forward, pause/resume, See result, and reload.
- Preview and Fast Forward measurement purity, including nested ability state.
- Deterministic offers, reservations, owned free refits, and restore at every reward/arrival boundary.
- Contract success, simultaneous contract and milestone completion, failure, and nonrepeatable payouts.
- Carried equipment, checkpoint funding, expedition loss, permanent research, and v0–v3 compatibility.

### Economy and progression audit

Extend [the opening-build audit](checks/balance-audit.js) and [world progression tests](tests/world-progression.test.js). The current audit assumes shared stock generation between compared versions; the new audit must construct each ruleset through its own versioned start and stock logic.

Audit all kits, unresearched and fully researched profiles, representative intermediate ranks, all worlds, checkpoint starts, and carried arrivals. Start with the existing five seeds for comparison, then broaden the deterministic sample and retain adversarial seeds as regression fixtures. Compare timing at 90%, 110%, and 120%, with near-threshold timing cases where needed.

Evaluate several purchase policies: immediate altitude, saving for combinations, contract earnings, and cautious progress. Exhaust affordable loadouts at bounded opening and arrival states; use bounded multi-step searches for purchases, missions, and reservations. Label sampled policy results separately from exhaustive results.

Record completion, misses, launch counts, distinct final builds, experimental use, purchases that become obsolete immediately, credits left unspent, and first-launch departures by world. Investigate universal best builds, unavoidable losses caused by stock, repeated contract farming, and money snowballs that remove later decisions.

Keep goals fixed for a world and rules version. Do not add mandatory launch counts, cap earned milestones, increase goals with research, or erase earned power to achieve a target duration.

### Browser and human testing

Use uniquely named isolated Playwright sessions. Cover 320×568, 375×667, 390×844, 667×375, 844×390, and 1366×768. Inspect screenshots, essential actions, text, tap targets, and console output, including the CLI's `### Result` and `### Error` sections. Protect player saves and shared preview servers.

Human playtests are the decision gate for fun. Run at least six complete prototype attempts across several seeds and both novice and returning perspectives where available. Log concrete observations locally without adding analytics to the shipped game:

- Can the player explain the ability they bought and why its partner matters?
- Does a different seed lead them to make a different purchase decision?
- Can they point to a successful combination during a flight?
- Does arriving on the Moon cause a meaningful refit or planning decision?
- After a miss, can they identify an actionable recovery using available resources?
- Do optional contracts change builds, or simply pay extra for the same flight?
- Is the longer attempt enjoyable to continue, and easy to leave and resume?
- After finishing or losing, do they have a specific different build they want to try?

Proceed only when the prototype produces several viable strategies, visible combination payoffs, understandable failures, and sufficient decisions to justify its extra time. If attempts feel repetitive or players consistently skip experimental choices, revise the design before extending the route. Simulations establish balance and integrity; they do not establish enjoyment.

Keep automated sessions, agent walkthroughs, and actual human feedback labeled separately. If human feedback is not yet available, deliver the playable prototype and the technical findings with the enjoyment gate still open.

## Implementation phases

| Phase | Deliverable | Completion gate |
| --- | --- | --- |
| 1 — Specify and model | Concrete stats/prices for six parts, contract definitions, itinerary transitions, versioned save schema, and baseline simulation results | Effects have explicit triggers and tradeoffs; baseline and compatibility fixtures are recorded |
| 2 — Build the domain | Ability simulation, offers/reservation, finite contracts, carried inventory, checkpoint starts, and versioned restore behind a local prototype switch | Domain, determinism, settlement, and legacy tests pass; all simulated flights terminate |
| 3 — Play Earth and Moon | Complete hangar → flight → report → refit → travel → adaptation loop with readable mobile feedback | Full prototype attempts can be played and resumed without fixtures or debug actions |
| 4 — Evaluate and revise | Playtest notes, economy audit, pacing measurements, and adjustments to weak families or recovery | Longer play produces distinct choices and motivates another attempt; no unresolved dominant strategy or critical save issue |
| 5 — Extend the campaign | Mars completes the first expedition, then the remaining two expeditions, catalog unlocks, world-specific contracts, and Tau Ceti integration | Earned full campaigns and checkpoint recovery work across kits and research levels |
| 6 — Finish and publish | Rocket collection/records as justified, presentation polish, updated documentation, cache versions, and release validation | Reviewed public-safe diff, passing relevant checks, Pages commit confirmation, isolated live smoke check |

Implement these as reviewable increments. Phase 4 is a genuine decision point; the later phases should be revised if longer expeditions or a family fail the playtest. The owner subsequently requested public access to the first prototype as the default. Both campaigns now coexist in a versioned save envelope; keep their progress separate and preserve unsupported saves. Continue using isolated browser sessions for tests.

Before public rollout, test release recovery as well as forward migration. Retain an untouched copy of the last supported save inside this game's existing save envelope during migration, and provide a recovery/export path for unsupported data. A rollback build must recognize and preserve the new envelope; redeploying the current old code unchanged could discard a new-format run. Prefer a compatible corrective release. Update entry-point and transitive module cache versions together, then confirm that GitHub Pages built the validated commit and run an isolated live smoke check.

## Scope boundaries and open design questions

The initial prototype includes two worlds, six experimental parts, standard stock, one reserved offer, a small contract pool, carried equipment, checkpoint recovery, and clear activation feedback. Existing research remains in place. Broader research unlocks and the rocket collection follow after the core passes its playtest.

Defer a nine-world permadeath mode, branching route maps, multiplayer, global leaderboards, daily service dependencies, crafting currencies, elaborate rarity tiers, manual steering, and a framework migration. They are not needed to evaluate this direction.

Resolve these questions through the prototype:

1. Does carrying a rocket across worlds produce enough adaptation to justify the longer expedition?
2. Is three misses across that expedition fair, or does a visible transition recovery improve play?
3. Do contracts add worthwhile choices without becoming compulsory income?
4. Can a six-part catalog produce several appealing combinations, including partial and mixed builds?
5. Does the target duration emerge from decisions, or do goals and rewards still create padding?
6. Does the full-route record provide enough incentive when a shorter checkpoint start is available?

## Implemented increment: missions and a flight journal

The owner has asked to continue expanding the public journey. This increment gives optional replay a concrete purpose while keeping the current mobile hangar and travel boundaries.

1. Give each world four equipment missions, offering two per attempt: one early objective and one later objective. Seed the pair when the attempt starts; reloads and shop refreshes cannot reroll it. Mix light/booster-free builds, staging, capsules, and pointed fairings. Keep the existing two-contract payout budget and milestone rules. Old attempts retain their original pair and interrupted-flight eligibility.
2. Record completed mission stamps permanently, including on failed attempts. Track world clears with each of the three starting kits. These are optional collection goals, not required progression or new currencies.
3. Save each world's fewest-launch winning rocket in the existing Journey records panel, including its parts, traits, research rank, and launch mass. Separate fresh starts from carried Moon arrivals so their records are comparable. Count launches within that world, not the whole Earth–Moon expedition. Never invent missing historical records.
4. Show collection progress and a world selector inside that optional panel; keep the hangar free of additional controls. Explain how to pursue a new stamp or kit badge by explicitly replaying an unlocked world. Records never auto-fit or purchase parts.
5. Verify deterministic boards, legacy and interrupted saves, settlement exactly once, journal persistence and validation, earned journeys and researched starts, and all six viewport sizes. Update documentation and coherent cache versions, then publish and smoke-test Pages.

This is a replay and build-choice increment. New part abilities, longer carried chapters, and research branches remain separate design work. Automated checks establish correctness and sampled balance; enjoyment still needs player feedback.

Implementation verification: all 110 Node tests pass, including earned full journeys and all 36 mission requirements. The sampled balance policies completed 60/60 Earth–Moon/checkpoint cases and 210/210 later-world cases. Isolated browser checks cover the six journal and hangar layouts, campaign switching, old saves and next-world selection, a resumed mission flight, and a fresh six-launch Earth–Moon journey through visible controls with automated gold timing. Save version 3 protects journal data from the previous build; versions 1/2 migrate with their existing mission pairs. These results do not establish human enjoyment.

## Implemented increment: equipment interactions

The owner approved the equipment-and-synergy pass. Add three automatic abilities to the existing unified parts shelf, retaining two seeded special offers and free reservation. On new runs, one available slot favors a partner for fitted special equipment; the other is drawn from the wider pool. An existing reservation remains protected. No additional hangar panels, currencies, flight interruptions, or changes to travel boundaries.

| Part | Specification | Decision and interaction |
| --- | --- | --- |
| Momentum engine | 560 credits; 0.26 t; 3.1 base thrust; normal fuel efficiency; thrust ramps from 65% to 190% over 10 simulated seconds | Weak at ignition; long tanks and released reserve fuel give its stronger late burn time to work. Short fuel supplies may never reach full power. |
| Drop tank | 540 credits; 0.62 t including 0.32 t fuel; 13 seconds base burn; drops 0.20 t empty dry tank mass halfway through its burn | Heavy at launch, lighter later. Works with long-burning engines and side boosters; no fuel is created or discarded by the dry-mass release. Research scales the released dry mass consistently. |
| Return boosters | 180 credits; 0.28 t; 1.2 kick; recover 90 credits after separation on a successful flight | Heavier and weaker than Twin kickers. Recovery requires a new milestone or the selected unfinished contract; misses never produce recovery credits. Can activate Reserve/Separation equipment or support a science-income build. |

New runs use equipment version 2; missing/version-1 fields keep the original six-part pool and exact ability behavior, including subsequent stock refreshes. Save version 4 protects new equipment from older builds. Existing original-campaign conditions, current roguelite targets, and mission boards stay unchanged.

Use the real fixed-tick simulation for previews, timing advice, Fast Forward, and See result. Show ramp progress and one-time release/recovery events in the existing flight feedback; show recovery earnings distinctly in the report. Keep fuel and dry-mass accounting finite and event logs bounded. Winning rocket snapshots must retain the new IDs.

Validation: ability boundary/combination tests, preview purity, speed and interrupted-flight equality, once-only recovery payouts, old-pool determinism, and future-save rejection. Audit earned progression across kits/worlds/research levels, exhaust affordable perfect-timing opening builds, and compare selected new combinations against their alternatives. Check all six screen sizes and a real earned browser run. Tune specifications if those checks reveal dominance or traps, document measured results, then publish and verify Pages. Longer expeditions remain separate work; simulations cannot establish enjoyment.

Equipment validation: 118 Node tests pass, including six exact preceding-release rocket outcomes, new combination/preview/playback checks, and earned full journeys. Earned policies completed 60/60 Earth–Moon/checkpoint starts and 210/210 later-world starts. The separate perfect-timing opening audit found 30/270 possible first-launch world clears with equipment v1 and 14/270 with v2; fully researched counts were 25/135 and 11/135. The initial expanded random pool left one sampled greedy path short of a useful partner; companion offers restored the sample to 60/60. Short-burn and long-burn comparisons drove the final Momentum/Drop specifications above. These remain simulated results, not player telemetry or enjoyment findings.

Browser verification: the new equipment check passes all six preview, flight, and report layouts, including simultaneous contract/survey/recovery bonuses, accelerated pause/resume, a real resumed combination flight, and one-time settlement after reload. Flight feedback was moved beside the rocket after screenshot review. Campaign switching preserves both saves; a fresh earned Earth–Moon UI run reached Mars in six launches using automated gold timing. A separate check of 108 fully researched end-game combinations across nine worlds found no preview/trajectory mismatch and a maximum simulated duration of about 320 seconds, within the existing 600-second preview/See result bound.


## Implemented iteration: build feedback and departure continuity

The owner requested iterative improvements and agent playthroughs. An isolated opening review reached Mars setup in five launches (four Earth, one Moon), exposing weak explanations of equipment payoffs and a large terminal credit payout with no onward use. This iteration preserves targets, equipment physics, cumulative milestone awards and the existing Earth–Moon carry boundary.

- Explain when previews disable or activate fitted companion effects. Keep base part tradeoffs separate from seeded bonuses. Give the equipped build a concise identity and matching visible special hardware.
- Show stage/tank separation as readable falling hardware, scale Momentum exhaust with its actual ramp, and surface passive combinations during flight. Cosmetic animation uses presentation time, freezes while paused and respects reduced motion. Distinct terrain silhouettes give destinations more visual character without making scientific claims about launch sites.
- Add an optional flight log with actual powered/coasting time, launch mass, equipment outcomes (including failure to reach full thrust), and itemized earnings. Compare consecutive same-world build estimates at identical 110% timing, including research. Preserve this data on reload; missing historical estimates stay unknown.
- On new journey-version-1 attempts, first Moon–Pluto clears transfer 10% of closing credits, capped at 200, to the next world's fresh rocket. Pay the transferred credits once after that rocket's first completed flight, even on a miss. Keep starting budgets unchanged, preserve reservations through campaign switching, and prevent replay farming. Earth carries its full budget and Eris retains the final ending. Legacy attempts keep their prior earnings.
- Use save version 5 to protect the new fields from older builds, retaining all versions 1–4, interrupted flights and the separate original campaign.

The first funding experiment paid upfront; exhaustive affordable perfect-timing opening checks found 23/210 later-world clears versus 7/210 without it, all involving maximum research. Paying after the first flight restored 7/210 without removing earned multi-milestone victories. Sampled earned policies still complete 60/60 Earth–Moon/checkpoint cases and 210/210 later-world cases. These are simulations, not human enjoyment findings. Longer carried chapters and expanded research remain separate design work; an effortless carried Moon clear is allowed when the build earns it, rather than forcing extra launches.

The continued browser walkthrough exposed two feedback issues: an armed launch briefly retained the previous displayed power until the next animation frame, and a build only 0.3% above its goal at 110% was marked “Within reach.” Arming now resets the displayed meter and power immediately. Readiness now warns “Aim for gold” when 110% reaches the target but 100% does not; it retains the separate “Gold can reach it” message when only stronger timing bridges the estimate. Unit and browser checks cover the distinction.

Release verification: 125 Node tests pass, including six earned full journeys. Isolated browser checks pass for equipment, combination warnings, flight logs/funding, the mobile builder, campaign switching, next-world setup/ending and Fast Forward. Phone, landscape and desktop layouts were checked at all six required sizes and screenshots inspected. A fresh browser journey through normal controls reached Tau Ceti in 42 launches using all three kits, including one Mars retry and recovery from two Europa misses; it used automated timing and Fast Forward, not injected credits or unlocks. It exposed the timing/readiness fixes above while progressing. The ending and records survived reload, and both test browsers reported no console errors. This is an agent walkthrough, not a human enjoyment result.
