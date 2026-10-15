# Ball Pro Max

Mobile-first, static marble shooter prototype. Original code and procedural art. No server, account, payments, or runtime dependencies. Modern Safari and Chrome are the initial targets; physical phone validation is still required.

Run `node scripts/build.mjs` then `node scripts/serve.mjs`, then open http://127.0.0.1:4174. Run `node --test tests/*.test.mjs` for rules checks. GitHub Pages deploys `dist/` through the included Actions workflow. The preview server exposes only built game assets on loopback.

## Controls

- One hand: drag outside the dotted perimeter to aim. Tap inside to fire. Drag release never fires. There is no aim preview.
- Two hands: drag the aiming pad horizontally (or vertically) to rotate; tap FIRE with the other hand. Left/right pad placement is selectable.
- Desktop: point and click, Space to fire, arrow keys to adjust, X or the ammo button to swap.
- Swap exchanges current and next ammunition. Settings pause the simulation. Backgrounding pauses automatically.
- Portrait and landscape layouts use the same game coordinates. On iPhone, use Safari Share → Add to Home Screen, enable Open as Web App when offered, then launch the icon. Fullscreen button requests native fullscreen when available.

## Bonus reels

Every **9 cleared balls** earns an automatic spin. The three reels stop one after another over 1.8 seconds. The chain, projectiles, cooldowns and active power timers stop during the spin; manual pause stops the reels too. Excess clears are retained, and multiple earned spins queue. Every spin resolves once, including a spin earned on the final clear before level completion.

| Outcome | Behavior | Relative weight |
| --- | --- | --- |
| Aim preview | A trajectory to the first collision for 12 active gameplay seconds; durations stack | 25 |
| Burning balls | Next 3 shots clear the hit ball and its immediate chain neighbors, regardless of color | 20 |
| Infected balls | Next 3 shots recolor the hit ball and up to 2 neighbors on either side, then resolve matching groups | 15 |
| Color shift | Changes the loaded ball to a different available color when possible | 15 |
| Gold | Adds 1 in-game gold piece | 20 |
| No reward | Mixed reel symbols, no effect | 15 |

Weights are relative chances, not percentages; these defaults total 110. Each reward is selected once when a spin starts. Matching symbols indicate a reward, mixed symbols indicate no reward. No fake near-miss selection or independent visual outcome determines the prize. Reels and outcome names are visible in the cabinet below the board, with miniature reels beneath the turret. The power status shows seconds or shots remaining. Burning charges fire before infection charges when both are held; missed powered shots still consume a charge. Changing ammo does not discard charges. No preview is visible until awarded.

Gold is a run-only collectible without spending, purchase, cash value or local persistence. It carries to the next level; retry/restart restores the gold total from the start of that level, and replaying the completed campaign starts a new run. Powers, charge and pending spins reset on each new level/retry. Gold persistence and spending are future work.

Edit **`levels/slots.json`** to change the threshold, spin/result timings, symbols, labels, reward quantities and relative weights. Set a stage's `slots` field in `levels/campaign.json` to `false` to disable reels, or to an object to override global settings. For theme-specific powers, supply a replacement `rewards` array using the supported reward types. A new power behavior belongs in the explicit simulation reward/impact rules, not the renderer.

## Editable levels and skins

Edit `levels/campaign.json` in any text editor. The campaign contains three stages. Each stage sets ball colors/count, movement and shot speeds, radius and spacing, and an arc-length sampled path. Use a `spiral` specification or a `polyline` path:

```json
{"type":"polyline","points":[[500,138],[800,200],[850,650],[500,850],[180,650],[200,300],[600,300],[680,500],[600,600]]}
```

Coordinates use a 1000 × 1000 logical board with a fixed turret at (500,500). Keep paths inside the perimeter (radius 430), clear of the turret (radius 65), and spaced so nonadjacent track sections are at least two ball diameters apart. The last point is the losing gate. Tune levels through playtesting; these initial settings are provisional.

Edit `skins/orbit.json` to replace palette, symbols, track colors and turret color. The renderer is the only module that draws art; replace it for a larger visual reskin. No external fonts or assets are required.

## Architecture and future slots

- `src/game.js`: seeded headless simulation, spawning, swept projectile collision, insertion, matches, gap closure, combos, ammunition and win/loss. No DOM, audio or rendering imports. Time advances only through `step`.
- `src/path.js`: path geometry sampled by distance; independent of display orientation.
- `src/input.js`: pointer ownership and control profiles; emits aim/fire intent.
- `src/render.js`: skin-driven canvas drawing and transient particles. Screen transforms do not alter rules.
- `src/audio.js`: user-gesture unlocked procedural sound.
- `src/main.js`: loading, session lifecycle, menus, settings persistence and event consumers.
- `src/slots.js`: independent seeded reward RNG, weighted selection, charge carryover, spin phases and reel symbols. The browser gives slot outcomes a fresh seed on every stage attempt, independently of the deterministic board setup.

`balls-cleared` events carry count, color, combo, points and clear source. The authoritative clear operation charges the slot state once; the visual event queue can be drained without losing progress. `step` advances slot timing and applies a resolved reward through `applyReward`. `slots-started`, `slots-result` and `reward-applied` events drive presentation; reading or drawing reel symbols never consumes RNG or grants rewards. This keeps gold and effect state independent of the animated cabinet.

Rules and slot tests run with `node --test tests/*.test.mjs`. Optional browser checks need an installed Playwright module and browsers: set `PLAYWRIGHT_MODULE_PATH` when the module is outside normal resolution, start the built preview, then run `node scripts/browser-check.cjs` and `node scripts/slots-browser-check.cjs`. The slot checks use intercepted level/config fixtures to force every result through a real shot and match; production has no test buttons or reward overrides.

The project deliberately uses browser-native ES modules with no build framework for this small static demo. Its boundaries follow DriverSweetLover and Dachshunt; migrating these modules to TypeScript/Vite does not require changing the simulation contract.

No service worker is included yet, so new deployments are not trapped behind stale offline caches. Settings alone are persisted; runs restart on reload.
