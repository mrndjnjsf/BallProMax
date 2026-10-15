# Ball Pro Max

Mobile-first, static marble shooter prototype. Original code and procedural art. No server, account, payments, or runtime dependencies. Modern Safari and Chrome are the initial targets; physical phone validation is still required.

Run `node scripts/build.mjs` then `node scripts/serve.mjs`, then open http://127.0.0.1:4174. Run `node --test tests/*.test.mjs` for rules checks. GitHub Pages deploys `dist/` through the included Actions workflow. The preview server exposes only built game assets on loopback.

## Controls

- One hand: drag outside the dotted perimeter to aim. Tap inside to fire. Drag release never fires. There is no aim preview.
- Two hands: drag the aiming pad horizontally (or vertically) to rotate; tap FIRE with the other hand. Left/right pad placement is selectable.
- Desktop: point and click, Space to fire, arrow keys to adjust, X or the ammo button to swap.
- Swap exchanges current and next ammunition. Settings pause the simulation. Backgrounding pauses automatically.
- Portrait and landscape layouts use the same game coordinates. On iPhone, use Safari Share → Add to Home Screen, enable Open as Web App when offered, then launch the icon. Fullscreen button requests native fullscreen when available.

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

`balls-cleared` events carry count, color, combo and points. A future slot system can consume these events, accumulate charge and emit reward commands. Keep reward randomness separate from board randomness. Rewards should enter simulation through an explicit effect/reward API, with time-limited state (the reserved `effects.previewUntil` is currently inactive). Future themes can configure reward tables for preview, infection, burning balls, changed ammo, gold or no reward. Keep coin economy and persistence separate from visual reels. The three dim dots below the turret reserve reel space; v1 has no slot rolls, power-ups or currency.

The project deliberately uses browser-native ES modules with no build framework for this small static demo. Its boundaries follow DriverSweetLover and Dachshunt; migrating these modules to TypeScript/Vite does not require changing the simulation contract.

No service worker is included yet, so new deployments are not trapped behind stale offline caches. Settings alone are persisted; runs restart on reload.
