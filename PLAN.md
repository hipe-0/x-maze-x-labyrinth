# X MAZE X — Next Improvements Plan

Date: 2026-10-26
Project: `2026-10-26 Labyrinth Casio Online`

Current state: the calculator keypad is an 8×4 square-key grid, the arrows form a
cross around `ENG`, the full number pad is visible, inactive keys are faded, and
the LCD renders at an integer device-pixel scale (with a possible inactive
margin on fractional DPR / smaller layouts).

This plan is ordered by impact. Phases 1 and 2 are the recommended next work.

---

## Guardrails

- Do not modify `../2026-10-16 Labyrinth Casio`.
- Keep the renderer at the fixed 96 × 64 framebuffer and 30 fps.
- Keep the five active controls: up, down, left, right and EXE/select.
- Keep the Casio FX-7500G tribute look and the "fan project, not affiliated
  with Casio" disclaimer.
- Run `npm run lint`, `npm test` and `npm run build` before each commit.
- Commit each working phase separately.

---

## Phase 1 — Finish the device/LCD scaling story

### Goal

Make the calculator larger and more legible on desktop, and remove most of the
inactive LCD margin caused by integer scaling.

### 1.1 Raise the calculator maximum width

`src/ui/calculator.css` caps `.calculator-shell` at 560 px. At 1440 × 900 with
DPR 1 this forces the LCD to a 3× scale (288 px active image), leaving a visible
green margin inside the 363 px LCD window.

- Raise the cap to approximately **640 px** (tune between 620 and 680 after
  screenshots).
- Keep the existing aspect-ratio factor (`0.83`) unless measurements show it
  needs adjustment.
- Verify at 1440 × 900, 1280 × 720, 768 × 1024, 390 × 844 and 320 × 568.
- Expected at 1440 × 900 / DPR 1: calculator ~637 px wide (height-limited),
  LCD window ~413 px, fresh 4× canvas (384 px) → only ~29 px total margin,
  down from ~75 px. Keys and text grow ~14%.

Acceptance:
- No overlap with the site header or footer.
- LCD, keys and text remain proportional at every tested size.
- The LCD active image is visibly larger than before on large screens.

### 1.2 Add a persisted LCD display preference: `CRISP` / `FILL`

The integer scale is crisp but can leave an inactive border. Some users may
prefer a full-bleed, slightly softer LCD.

- Add a `displayMode: 'crisp' | 'fill'` preference, persisted in
  `localStorage` under `xmazex.display`.
- Default: `crisp`.
- `crisp`: current behaviour — integer device-pixel scale + `pixelated`.
- `fill`: canvas fills the LCD window with `image-rendering: auto` (smooth).
  Keep the 96 × 64 backing store; this is only a CSS presentation choice.
- Expose the setting in the About modal as a compact two-option control:
  - `CRISP — square pixels, may leave an inactive border`
  - `FILL — full panel, smoother pixels`
- Thread the preference from `App` → `Calculator` → `Lcd`, or use a small
  shared hook.

Files likely affected:
- `src/ui/calculator.css`
- `src/ui/Lcd.tsx`
- `src/ui/Calculator.tsx`
- `src/App.tsx`
- `src/ui/AboutModal.tsx`
- `src/index.css` (only if the About control needs styling)

Acceptance:
- Changing the option updates the LCD immediately.
- The choice survives a reload.
- `crisp` still produces uniform pixels at an integer scale.
- `fill` uses the whole LCD window.

### 1.3 Optional reference details (stretch)

- Give the inactive `SHIFT` key a faint blue face, like the original.
- Add a decorative side `ON/OFF` slider or `CONTRAST` wheel. If functional, the
  contrast wheel could adjust LCD brightness/ghosting and persist the value.
- Only add these if they do not clutter the mobile layout.

---

## Phase 2 — Make the game feel complete

### 2.1 Real run stats (moves + elapsed time)

- Add a moves counter to `Game`:
  - Increment only on successful forward/back moves (not on blocked bumps).
  - Optionally track turns separately.
- Add elapsed play time:
  - Accumulate only while `screen === 'PLAY'`.
  - Save the accumulated value so `CONTINUE` resumes accurately.
- Extend `SaveData`:
  - Add `moves`, `elapsedMs` and possibly `visited` (Phase 2.3).
  - Bump `SAVE_VERSION` to 2 and either migrate v1 saves or accept missing
    fields with defaults.
  - Add validation tests for old and new save payloads.
- Display on the pause screen and the win screen:
  - `MOVES 214`
  - `TIME 02:31`
  - Keep `1091 STEPS` clearly labelled as the program-size homage, not the
    player's move count.
- Optional: store a best result per seed in
  `localStorage` (`xmazex.best.<seed>`) and show `BEST` on the title/win screen.

Files likely affected:
- `src/game/game.ts`
- `src/game/game.test.ts`
- `src/game/render.ts`
- `src/game/render.test.ts`
- `src/game/menu.ts` (if pause/win menu text changes)

Acceptance:
- A fresh maze starts at zero moves and zero time.
- Pausing stops the timer; resuming continues it.
- Reloading `CONTINUE` preserves moves and elapsed time.
- Old saves do not crash the game.

### 2.2 Better win flow

- The win screen currently auto-returns after 2.6 s. That is too short once
  stats are added.
- Keep the initial flash, then hold the screen with stats and a prompt:
  - `EXE=NEW MAZE`
  - maybe `UP/DOWN=TITLE`
- Define the exact new interaction and update `WIN_HOLD_MS` / `update()` /
  `confirm()` tests accordingly.
- Ensure `isInverted()` no longer flashes after the initial celebration, or
  stop the flash entirely once stats are shown.

### 2.3 Map improvements

Current `drawMap()` draws walls, entry/exit chevrons and a blinking 2×2 player
marker.

- Track visited cells in `Game` (a `Uint8Array` of 20 × 18 or a `Set`).
  - Reset on new maze.
  - Mark the current cell whenever the player moves.
  - Save it if the map should survive `CONTINUE`.
- Render visited cells as single centre dots inside the 4 × 3 px map cells.
- Add a small direction indicator for the player:
  - Use the existing `ARROWS` glyph (or a 3 × 3 pattern) next to/instead of the
    blinking square.
- Keep the blinking marker for visibility, but make its orientation readable.
- Space is tight: validate at 96 × 64 and update render tests/snapshots.

Acceptance:
- The map clearly shows where the player has been and which way they face.
- Entry and exit remain identifiable.
- The map still fits in 96 × 64 with no overlapping labels.

---

## Phase 3 — Mobile and accessibility

### 3.1 Swipe gestures on the LCD (optional but high value)

The physical keys are only ~33–35 px on a phone.

- Add pointer/touch handlers around the LCD window or a larger transparent
  touch layer over the calculator display.
- Swipe up/down = forward/back; swipe left/right = turn.
- Use a threshold (~24 px) and ignore tiny drags.
- In menus, swipe up/down can move the selection.
- Show a one-line hint on touch devices, e.g. `SWIPE OR USE THE KEYS`.

Acceptance:
- Swipes do not trigger when the user taps a physical key.
- A swipe produces exactly one action (key down + key up).
- Mouse users are unaffected.

### 3.2 Screen-reader status and keyboard discoverability

- Add a visually hidden `aria-live="polite"` region that announces:
  - screen changes (`Title`, `Playing`, `Paused`, `Map`, `You win`),
  - selected menu item,
  - blocked move / win events,
  - possibly position and facing.
- Add `aria-keyshortcuts` to the calculator region or buttons.
- Review whether making the five active buttons tabbable is worth the added
  event complexity. The current global arrow-key handler already makes play
  possible without focus; a live region is the safer first step.

### 3.3 Respect reduced motion for the win flash

`prefers-reduced-motion` currently disables CSS animations but the game still
flashes the inverted LCD on win.

- Pass a `reducedMotion` flag into `Game` (or check the media query in `App`).
- Disable `isInverted()` flashing when reduced motion is requested.
- Keep the rest of the win flow intact.

### 3.4 Pause the loop when hidden / modal open

- In `useGameLoop`, listen for `visibilitychange` and stop scheduling frames
  while the tab is hidden.
- Save on hide.
- Optionally pause rendering while the About modal is open, then resume.

Acceptance:
- Returning to the tab resumes without a burst of catch-up frames.
- The game state is saved before the page is hidden.

---

## Phase 4 — Distribution and quality

### 4.1 PWA / offline install

- Add a web app manifest:
  - name, short name, theme/background colors,
  - `display: standalone`,
  - relative `start_url` and `scope` so it works on GitHub Pages,
  - 192/512 px icons and a maskable icon.
- Add a service worker (e.g. `vite-plugin-pwa` generateSW, or a small custom
  service worker) to cache the app shell, fonts and assets.
- Test: install, reload offline, verify the share URL still works.

### 4.2 Social preview for seed links

- Add `og:image`, `og:url` and `twitter:card=summary_large_image`.
- Put a 1200 × 630 preview image in `public/` (calculator + maze screenshot).
- Keep relative paths so project-page deployments still work.

### 4.3 Tests and refactors

- Extract the LCD fit calculation from `usePixelPerfectScale` into a pure
  helper, e.g. `computeLcdScale(width, height, dpr)`.
- Add unit tests for:
  - integer scale selection,
  - `crisp` vs `fill` mode decisions,
  - minimum/clamped scale.
- Add a lightweight DOM test for keypad action wiring if a DOM test setup is
  introduced (React Testing Library + jsdom). Do not add heavy dependencies
  unless the UI grows.
- Keep `npm test`, `npm run lint` and `npm run build` green after every phase.

### 4.4 Documentation

- Update README screenshots after Phase 1 and Phase 2.
- Document the `CRISP` / `FILL` display preference in the About modal copy.
- Add a short note that the win stats are player metrics while `1091 STEPS` is
  the original program-size homage.

---

## Recommended order

1. Phase 1.1 — larger calculator (single visual change, immediate payoff).
2. Phase 1.2 — `CRISP` / `FILL` preference.
3. Phase 2.1 — moves/time stats and save migration.
4. Phase 2.2 — win flow.
5. Phase 2.3 — map trail and direction.
6. Phase 3 — accessibility / mobile.
7. Phase 4 — PWA, social preview, tests and docs.

Do not start Phase 2 before Phase 1 is visually settled, because the larger
calculator changes the screenshots and the LCD scale across all screens.
