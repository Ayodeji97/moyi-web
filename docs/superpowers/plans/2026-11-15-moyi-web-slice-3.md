# moyi-web Slice 3: the evening in motion, Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** When JavaScript runs and reduced motion is off, "the evening" becomes one pinned scene four screens tall, driven by scroll, exactly as spec §5's table describes. Without JavaScript, or with reduced motion, the slice 2 still frames stay as they are.

**Architecture:**
- **Progressive enhancement.** The slice 2 markup is the base. One module script adds `data-live` to `#how` and takes over. The CSS for `[data-live]` turns the four frames into layers of one sticky stage.
- **The timeline is a pure function**, `evening(p)`, from scroll progress to a plain state object. Every rule in spec §5 is tested there without a browser. A thin `apply` step writes that state to the DOM through CSS custom properties and the phone controller.
- **Canvas footage stand-ins**, ported from the preview, paint inside the existing `.scene` elements. They run only in live mode, pause off screen and when the tab is hidden, and draw from one palette that is contrast-tested.

**Tech Stack:** unchanged (Astro 7.4.4, TypeScript 6.0.3, Vitest 4.1.12, jsdom 30.1.3, Wrangler 4.156.1). No new dependencies.

**Spec:** `docs/superpowers/specs/2026-11-15-moyi-website-design.md`, slice 3 of §10. The motion design is in §5 (the `p` table), §6.3 (scroll engine), §6.5 (pausing), §6.6 (reduced motion and no JS), §6.10 (the design-system exception). The look and the canvas scenes come from `preview/moyi-directions.html`: option 4's `update` function near line 633, `phone()`/`ctl()`/`scrub()` near line 406, and `SCENES` near line 451. Where the preview and the spec disagree on behaviour, the spec wins.

## Global Constraints

Everything in the slice 1 and slice 2 Global Constraints still binds. In addition:

- **Branch.** `feat/slice-3`, cut from `main` at `7dd391e`. One commit per task.
- **Astro stays at 7.4.4.** Today 7.4.5 is 13 days old, one day short of the two-week rule.
- **The CSP is unchanged.** The home page's script is one external module that Astro emits under `/_astro/`. Nothing inline:
  - no `<script>` without `src`;
  - no `setAttribute('style', …)` and no `style.cssText`;
  - runtime styling only through `element.style.setProperty(...)` or single-property assignment (CSSOM, which `style-src 'self'` allows), preferably CSS custom properties on the stage.
  - If Astro inlines the small script, set `vite: { build: { assetsInlineLimit: 0 } }` in `astro.config.mjs`. The existing "no inline code" test must keep passing.
- **The fallback is untouched.** With no JS, or with `prefers-reduced-motion: reduce`, the built HTML and its rendering are exactly slice 2's: no `data-live`, no canvas, no word dimming. The engine never runs under reduced motion. If the setting turns on while the page is open, the engine tears itself down back to the still frames.
- **Strict screen swaps (spec §6.3).** In a phone, an incoming view becomes visible only after the outgoing one is `hidden`. At no instant are two views of one phone visible.
- **Transforms and opacity only** for anything driven per frame. No property that triggers layout is changed on scroll.
- **One passive scroll listener and one `requestAnimationFrame` per frame** for the whole page. Canvases redraw at most 30 times a second, at most at device pixel ratio 1.25, only while intersecting the viewport, and never while `document.hidden`.
- **Weight.** The existing 150 KB test (HTML, CSS, JS and fonts) must pass with the new script included.
- **Design-system exception (spec §6.10).** Scroll-driven motion is allowed on this page only. Everything else in the design system still applies.

## Review Focus

1. **A fast fling or a jump** (End key, an anchor link to `#get`, a reload mid-page) must land in the right state, with no half-typed sentence stuck, no two phone screens, and no headline over a phone. Owned by Task 1 (state depends on `p` alone) and Task 2 (`set` called mid-transition settles immediately).
2. **Reduced motion switched on while the page is open** must return to the four still frames. Owned by Task 4, which tests teardown on a `change` event.
3. **White text over the canvas sky at its brightest** (the afternoon sun) must stay at or above 4.5:1 under the scrim. Owned by Task 3, which tests every palette colour.
4. **A background tab** must not keep drawing canvases. Owned by Task 3, which tests the loop with `document.hidden`.
5. **Screen readers in live mode** must still hear each phone's current screen. Owned by Task 2: the phone's `aria-label` follows its view.

---

### Task 1: The timeline, a pure function of scroll progress

**Files:**
- Create: `src/scripts/evening/timeline.ts`
- Test: `tests/timeline.test.ts`

**Interfaces:**
- Produces:
  ```ts
  export type View = 'today' | 'write' | 'wait' | 'reveal';
  export const ramp: (p: number, a: number, b: number) => number; // clamp((p-a)/(b-a), 0, 1)
  export const clock: (minutes: number) => string;               // 1300 -> "21:40", zero-padded, wraps at 24h
  export interface EveningState {
    hero: number;                    // headline block opacity
    sky: number;                     // 0..1, the sky canvas's own progress
    centre: { opacity: number; rise: number; view: View; typed: number; busy: boolean; time: string; cards: [number, number] };
    split: number;                   // 0 closed .. 1 fully open
    panes: number;                   // opacity of the pane contents (labels and phones)
    amara: { time: string };         // her pane phone always shows 'wait'
    tunde: { view: View; typed: number; busy: boolean; time: string };
    caption: { opacity: number; city: string; time: string; text: string };
    step: 0 | 1 | 2;
    bars: [number, number, number];
    rail: number;                    // opacity of the step rail and phone progress line
  }
  export function evening(p: number): EveningState;
  ```
- The values come from spec §5 and the preview's option 4 `update`, with the clamp applied first. `NaN` or a value outside 0 to 1 is clamped (NaN counts as 0):
  - `hero = 1 - ramp(p, 0, 0.07)`.
  - `sky = p < 0.72 ? ramp(p, 0, 0.3) * 0.55 : 0.55 + 0.45 * ramp(p, 0.72, 0.86)`.
  - `centre.rise = ramp(p, 0.08, 0.20)`.
  - `centre.opacity`: when `p < 0.5`, it is `rise * (1 - ramp(p, 0.26, 0.295))`. Otherwise it is `ramp(p, 0.82, 0.87)`.
  - **Centre view, before the split** (`p < 0.5`):
    - Let `k = 0.55 * ramp(p, 0.13, 0.26)`.
    - The view is `today` when `k < 0.12`, `write` when `k < 0.55`, and otherwise `wait`.
    - `typed = ramp(k, 0.14, 0.47)`, and `busy = view === 'write' && k > 0.49`.
    - `time` is `clock` of the minutes from 17:30 to 21:40, interpolated over `ramp(p, 0.13, 0.26)`.
  - **Centre view, after the split** (`p ≥ 0.5`):
    - The view is `reveal`, and `time` is `"23:10"`.
    - Let `r = ramp(p, 0.84, 0.92)`. Then `cards = [ramp(r, 0, 0.5), ramp(r, 0.4, 0.9)]`.
  - `split = ramp(p, 0.30, 0.37) * (1 - ramp(p, 0.72, 0.80))`.
  - `panes = ramp(p, 0.36, 0.41) * (1 - ramp(p, 0.68, 0.72))`.
  - **Tunde:**
    - Let `kb = ramp(p, 0.44, 0.66)` and `k2 = kb < 0.98 ? kb * 0.55 : 0.6`.
    - Apply the centre view rule to `k2`: `today` below 0.12, `write` below 0.55, otherwise `wait`.
    - `typed = ramp(k2, 0.14, 0.47)`, and `busy = view === 'write' && k2 > 0.49`.
  - **Clocks:** `m = 21*60 + 42 + Math.round(ramp(p, 0.36, 0.70) * 68)`. Then `amara.time = clock(m)` and `tunde.time = clock(m - 60)`.
  - **Caption:**
    - `opacity` is 1 when `(p > 0.12 && p < 0.27) || p > 0.86`, otherwise 0. CSS adds the 0.4 s transition.
    - When `p < 0.5`, `city` is `"Lagos"` and `time` is the centre time. Let `k = ramp(p, 0.13, 0.26)`. `text` is `"The day is open for writing. Nothing to chase."` while `k < 0.45`, then `"Amara writes one true sentence about Tunde."`.
    - Otherwise, `city` is `"Lagos 23:10 · London 22:10"`, `time` is `""`, and `text` is `"Your day is open. Both of you, at the same moment."`.
  - `step = p < 0.36 ? 0 : p < 0.78 ? 1 : 2`.
  - `bars = [ramp(p, 0.12, 0.36), ramp(p, 0.36, 0.78), ramp(p, 0.78, 0.94)]`.
  - `rail` is 1 when `p > 0.10 && p < 0.995`, otherwise 0.

- [ ] **Step 1: Write `tests/timeline.test.ts`.** Sample `p` from 0 to 1 in steps of 0.001 and assert, for every sample:
  - **the headline is gone before the phone shows** (spec §5): `centre.opacity > 0` implies `hero === 0`;
  - **one phone at a time** (spec §5): `split > 0` implies `centre.opacity === 0`;
  - `panes > 0` implies `split > 0.8`;
  - `cards[1] <= cards[0]`, so Amara's card never appears before Tunde's;
  - `tunde.time` is exactly one hour behind `amara.time`;
  - every number lies in 0 to 1.

  Then the point checks:
  - `evening(0)`: `hero` 1, `centre.opacity` 0, `step` 0, `rail` 0.
  - `evening(0.2)`: `centre.view` `'write'`, and `caption.city` `'Lagos'`.
  - `evening(0.33)`: `centre.opacity` 0 and `split` between 0 and 1.
  - `evening(0.55)`: `split` 1, `tunde.view` `'write'`, and `step` 1.
  - `evening(0.97)`: `centre.view` `'reveal'`, `cards` `[1, 1]`, `step` 2, and `caption.text` is the "Your day is open" line.
  - `evening(NaN)` deep-equals `evening(0)`, `evening(-1)` deep-equals `evening(0)`, and `evening(2)` deep-equals `evening(1)`.
  - `clock(1300)` is `'21:40'`, and `clock(24*60 + 5)` is `'00:05'`.
- [ ] **Step 2: Run** `npx vitest run tests/timeline.test.ts`. Expected: FAIL, module not found.
- [ ] **Step 3: Implement** `timeline.ts`. It has no DOM access and no imports.
- [ ] **Step 4: Run** `npm run check && npm test`. Expected: all pass.
- [ ] **Step 5: Commit** `feat: the evening timeline as a pure function of scroll`.

### Task 2: The phone controller and its strict swap

**Files:**
- Create: `src/scripts/evening/phone.ts`
- Modify:
  - `src/components/Phone.astro`: data hooks and per-view labels.
  - `src/styles/phone.css`: scope the short class names under `.dev`, the slice 2 follow-up, and add the fade classes.
- Test: `tests/phone-controller.test.ts`

**Interfaces:**
- Consumes `View` from Task 1.
- **`Phone.astro` adds to its root:** `data-phone`, `data-mine={mine}`, and `data-label-today`, `data-label-write`, `data-label-wait` and `data-label-reveal`. These hold the four full label strings that `label` already builds for each view; the root's own `aria-label` is unchanged.
- **The write view's sentence element** carries `data-typed`. Its `.pa` carries `data-send`. The two reveal `.ec` cards carry `data-card="0"` and `data-card="1"`. The status-bar clock already has `.clock`.
- **`phone.css`:**
  - Every rule for `.v .an .lb .en .st .gr .pa .ec .isl .sb .glass .scr` becomes `.dev .x`.
  - Add `.dev .v.is-out { opacity: 0 }` and `.dev .v.is-in { opacity: 0 }`, with `transition: opacity 160ms var(--ease, ease)` on `.dev .v`.
  - Keep `.dev .v[hidden] { display: none }`.
- **Produces:**
  ```ts
  export interface PhoneController {
    set(view: View): void;          // strict swap
    typed(k: number): void;         // shows data-mine sliced to round(k * length); k >= 1 shows it whole
    busy(on: boolean): void;        // data-send text "Sending" when on, "Send" when off
    time(t: string): void;          // .clock text
    cards(a: number, b: number): void; // opacity and translateY((1 - x) * 14px) of data-card 0 and 1
    readonly view: View;
  }
  export function phoneController(root: HTMLElement): PhoneController;
  export const SWAP_MS = 160;
  ```
- **How `set(view)` swaps:**
  1. Mark the visible view `is-out`.
  2. After `SWAP_MS`, set `hidden` on it.
  3. Then remove `hidden` from the target, with `is-in`.
  4. On the next frame, remove `is-in`. The target fades in.
  5. Set the root `aria-label` from `data-label-{view}`.
  - If `set` is called again during a swap, cancel the pending timers and settle at once: every view `hidden` except the newest target, with no `is-out` or `is-in` left. Then start the new swap only if the target differs.
  - `set` with the current view does nothing.

- [ ] **Step 1: Write `tests/phone-controller.test.ts`.** Render `Phone` through the Astro container, as slice 2's `phone.test.ts` does, into jsdom, and use `vi.useFakeTimers()`.
  - Starting at `write`, call `set('wait')`. Advance time in 10 ms steps up to 400 ms. At every step, **at most one** `.v` lacks `hidden`. At the end, only `wait` is visible, and `aria-label` equals `data-label-wait`.
  - Call `set('today')`, then `set('reveal')` 50 ms later. After settling, only `reveal` is visible, and no `.is-out` or `.is-in` remains.
  - `typed(0.5)` shows the first `Math.round(len/2)` characters of `data-mine`. `typed(1)` shows all of it.
  - `busy(true)` makes the button read "Sending". `busy(false)` makes it read "Send".
  - `cards(1, 0)` gives card 0 `opacity: 1` and card 1 `opacity: 0`.
  - `phone.css` contains no top-level selector that starts with `.v`, `.st`, `.lb`, `.en`, `.an`, `.gr`, `.pa` or `.ec` (a regex over the file). It still has `.dev .v[hidden]` with `display: none`.
- [ ] **Step 2: Run** the test. Expected: FAIL.
- [ ] **Step 3: Implement** the controller, the `Phone.astro` hooks and the CSS scoping. Update slice 2's `phone.test.ts` only where the selector scoping requires it; its assertions keep their meaning.
- [ ] **Step 4: Run** `npm run check && npm test`. Expected: all pass, including slice 2's visual-structure tests.
- [ ] **Step 5: Commit** `feat: phone controller with a strict screen swap`.

### Task 3: Canvas scenes and their palette

**Files:**
- Create: `src/scripts/evening/palette.ts`, `src/scripts/evening/scenes.ts`
- Test: `tests/scenes.test.ts`, and extend `tests/contrast.test.ts`

**Interfaces:**
- **Produces `palette.ts`:** `export const PALETTE: Record<'sky' | 'lagos' | 'rain' | 'lamp' | 'bed', readonly string[]>`. These are all the solid colours each scene draws: gradient stops, orb colours at full strength, and window lights, written as 6-digit hex.
  - Start from the preview's `SCENES` values.
  - Darken the ones that fail the contrast test, keeping each one's hue.
  - The scene code may apply alpha to these colours, but it never uses a colour that is not in `PALETTE`.
- **Produces `scenes.ts`:**
  ```ts
  export type SceneName = 'sky' | 'lagos' | 'rain' | 'lamp' | 'bed';
  export interface Scenes { setSky(p: number): void; stop(): void }
  export function mountScenes(root: ParentNode, deps?: { raf?: typeof requestAnimationFrame; now?: () => number }): Scenes;
  ```
  - **Where the canvases go.** `mountScenes` puts one `<canvas aria-hidden="true">` inside each of these elements:
    - `.scene--sky-afternoon`, which is drawn with `sky`;
    - `.scene--lagos` → `lagos`;
    - `.scene--rain` → `rain`;
    - `.scene--lamp` → `lamp`;
    - `.scene--bed` → `bed`.

    It does not touch `.scene--sky-dusk` or `.scene--sky-night`; live mode hides those.
  - **Seeds.** Each scene's random generator is seeded as the preview seeds it, so the stand-ins look the same on every load.
  - **One loop.** There is one `requestAnimationFrame` loop for all canvases.
    - A canvas is drawn only when its last `IntersectionObserver` entry was intersecting. If `IntersectionObserver` is missing, draw it.
    - Nothing is drawn while `document.hidden`. The loop stops then, and restarts on `visibilitychange`.
    - At most one draw every 33 ms.
    - Pixel ratio is `min(devicePixelRatio, 1.25)`.
  - `setSky(p)` sets the sky's progress, which `draw` reads.
  - `stop()` cancels the loop, disconnects the observers and removes the canvases.
- **Port the preview's draw functions** with their shapes and motion, minus the preview's `reduce` branches, since the engine never runs under reduced motion.

- [ ] **Step 1: Extend `tests/contrast.test.ts`.** For every colour in every `PALETTE` entry, blend the scrim (`rgb(14,10,10)` at `--scrim-alpha` from `scenes.css`) over it, then assert that white reaches at least 4.5:1 and white at 0.8 alpha reaches at least 4.5:1. Also assert that `PALETTE` has all five scenes and at least 30 colours.
- [ ] **Step 2: Write `tests/scenes.test.ts`** in jsdom. Stub `HTMLCanvasElement.prototype.getContext` to return a recording fake (an object whose methods are no-ops and which counts `fillRect` calls). Use an injected `raf` and `now`.
  - Mounting on a fragment with one `.scene--sky-afternoon` and one `.scene--lagos` inserts exactly two canvases, and no canvas into `.scene--sky-dusk`.
  - With `document.hidden` true (stub `Object.defineProperty(document, 'hidden', …)`), stepping the injected `raf` 10 times draws nothing.
  - With `document.hidden` false and no `IntersectionObserver`, it draws. Two frames 10 ms apart draw once.
  - `stop()` removes the canvases, and a further `raf` step draws nothing.
- [ ] **Step 3: Run** both tests. Expected: FAIL.
- [ ] **Step 4: Implement** `palette.ts` and `scenes.ts`, darkening palette colours until the contrast test passes.
- [ ] **Step 5: Run** `npm run check && npm test`. Expected: all pass.
- [ ] **Step 6: Commit** `feat: canvas scenes with a contrast-tested palette`.

### Task 4: The pinned stage and the engine

**Files:**
- Create: `src/scripts/evening/engine.ts`, `src/scripts/evening/live.ts` (the testable `start`), `src/scripts/evening/main.ts` (the entry: exactly `import { start } from './live'; start(document, window);`, so tests can import `live.ts` without it running)
- Modify: `src/components/Evening.astro` (stage wrapper, rail, progress line, scroll hint, the `<script>`), `src/styles/evening.css` (the `[data-live]` rules)
- Test: `tests/engine.test.ts`; extend `tests/home.test.ts`

**Interfaces:**
- Consumes `evening` and `EveningState` (Task 1), `phoneController` (Task 2), and `mountScenes` (Task 3).
- **Markup changes in `Evening.astro`.** The static rendering must stay as slice 2's, so all new elements are `hidden` or `display: none` unless the section has `[data-live]`.
  - Wrap the four frames in `<div class="evening__stage" data-stage>`.
  - Add `data-role` hooks:
    - `hero` on frame 1's `.evening__hero`;
    - `centre` on frame 2's `.evening__phone`;
    - `caption` on frame 2's `.evening__caption`, with `data-city`, `data-time` and `data-text` on its `.ct`, `.tm` and `p`;
    - `panes` on `.evening__panes`;
    - `amara` and `tunde` on the two pane phones' wrappers;
    - `who` on each `.evening__who`, with `data-clock` on its `<b>`.
  - Add inside the stage, after the frames:
    - `<ol class="evening__rail" data-role="rail" aria-hidden="true" hidden>` with three `<li>`: "Amara writes", "Tunde writes", "Read together";
    - `<div class="evening__progress" data-role="progress" aria-hidden="true" hidden>` with three bars, each a `<span><i></i></span>` (the preview's `.prog4`);
    - `<div class="evening__hint" data-role="hint" aria-hidden="true" hidden>`, with "Scroll" and a line (the preview's `.hint`).
  - Add `<script>import '../scripts/evening/main.ts';</script>`. Astro bundles it as an external module.
- **CSS under `.evening[data-live]`:**
  - `.evening` is `400svh` tall.
  - `.evening__stage` is `position: sticky; top: 0; height: 100svh; overflow: hidden`.
  - The frames are absolutely stacked at `inset: 0`.
  - Frames 2 and 4's own scenes are hidden. Frame 1's scene, holding the sky canvas, is the stage background for the whole pin.
  - Frame 4 is hidden entirely: the centre phone and caption from frame 2 play both the first and the last moments.
  - The per-frame `.evening__step` labels become visually hidden but stay readable by screen readers, using the usual clip pattern.
  - The rail shows only at 900 px and wider, and the progress line only below 900 px. Both are unhidden by `start`.
  - Every animated property reads a custom property set on the stage: `--hero`, `--hero-y`, `--rise`, `--centre`, `--split`, `--panes`, `--caption`, `--rail`, `--bar-0`, `--bar-1` and `--bar-2`.
  - The split is `clip-path: inset(0 calc((1 - var(--split)) * 50%))` on desktop, and `inset(calc((1 - var(--split)) * 50%) 0)` below 700 px.
  - The rising phone is `translateY(calc((1 - var(--rise)) * 70svh)) scale(calc(.88 + .12 * var(--rise)))`.
- **Produces `engine.ts`:**
  ```ts
  export function progress(scrollY: number, top: number, height: number, viewport: number): number; // clamp((scrollY - top) / (height - viewport)); 0 if height <= viewport
  export interface Bound { apply(state: EveningState): void }
  export function bind(section: HTMLElement, scenes?: { setSky(p: number): void }): Bound;
  ```
  - **`apply` writes:**
    - every custom property above, from the state;
    - `centre`, `amara` and `tunde` through their phone controllers (`set`, `typed`, `busy`, `time`, `cards`). Amara's phone is set to `wait` once, at bind;
    - the caption text into `data-city`, `data-time` and `data-text`, but only when it changes;
    - the pane clocks;
    - `aria-current="step"` on the rail `<li>` whose index is `state.step`, and on no other;
    - `scenes.setSky(state.sky)`.
  - It never writes a value equal to the one it last wrote.
- **Produces `live.ts`, with `export function start(doc: Document, win: Window): () => void` returning a teardown:**
  - If `#how` is missing, or `win.matchMedia('(prefers-reduced-motion: reduce)').matches`, it does nothing and returns a no-op.
  - Otherwise it:
    1. sets `data-live` on `#how`;
    2. unhides the rail, progress line and hint;
    3. calls `mountScenes(doc)` and `bind`;
    4. adds one passive `scroll` listener and one `resize` listener, which schedule a single `requestAnimationFrame` that computes `progress` from `section.getBoundingClientRect()` and `innerHeight` and calls `apply(evening(p))`;
    5. applies once immediately.
  - It listens for the reduced-motion query's `change` event. When the query starts matching, it runs the teardown:
    - remove the listeners;
    - call `scenes.stop()`;
    - remove `data-live`;
    - re-hide the rail, progress line and hint;
    - clear the custom properties;
    - restore every phone to its built view, by calling `set` back to the view that was visible at load;
    - restore the caption's original text.

- [ ] **Step 1: Write `tests/engine.test.ts`** in jsdom. Load `dist/index.html` from a fresh build. Stub `matchMedia`, `requestAnimationFrame` (run synchronously) and the canvas `getContext`.
  - `progress(0, 0, 4000, 1000)` is 0, `progress(1500, 0, 4000, 1000)` is 0.5, and `progress(5000, 0, 4000, 1000)` is 1. `progress(10, 0, 800, 1000)` is 0.
  - With reduce matching, `start` leaves `#how` with no `data-live` and inserts no canvas. The body's `innerHTML` is unchanged.
  - With reduce not matching, `start` sets `data-live` and unhides the rail. After `bind(...).apply(evening(0.55))`:
    - `--split` is `"1"` on the stage;
    - the Tunde phone's visible view (after advancing fake timers past `SWAP_MS`) is `write`;
    - rail item 2 has `aria-current="step"` and the others do not.
  - Calling `apply(evening(0.55))` twice writes no new custom-property values the second time. Spy on `style.setProperty`.
  - Fire the reduce query's `change` with `matches: true`. Afterwards `data-live` is gone, no canvas remains, the rail is hidden, and each phone shows the view it had in the built HTML (`write`, `wait`, `write`, `reveal`).
- [ ] **Step 2: Extend `tests/home.test.ts`.** The built page has exactly one `<script`, it has `type="module"` and a `src` starting with `/_astro/`, and it has no inline body. Replace slice 2's "no script" assertion with this. The rail, progress line and hint are `hidden` in the built HTML.
- [ ] **Step 3: Run** both tests. Expected: FAIL.
- [ ] **Step 4: Implement** the markup, the CSS, `engine.ts` and `main.ts`. If the build inlines the script, apply the `assetsInlineLimit` rule from the Global Constraints.
- [ ] **Step 5: Run** `npm run check && npm test && npm run test:headers`. Expected: all pass, including the 150 KB weight test and the no-inline-code scan.
- [ ] **Step 6: Commit** `feat: the evening as one pinned scene, driven by scroll`.

### Task 5: The statement lights up, plus the slice 2 tidy-ups

**Files:**
- Create: `src/scripts/evening/statement.ts`
- Modify:
  - `src/scripts/evening/live.ts`: start and tear down the statement with the rest.
  - `src/styles/sections.css`: `[data-live]` word styles; delete the dead `.closing .foot` rule.
  - `src/styles/home.css`: `.foot` gets `padding-bottom: 40px`.
  - `tests/copy.test.ts`: also scan `aria-label` and `alt` values.
  - `README.md`: a "Motion" section.
- Test: `tests/statement.test.ts`

**Interfaces:**
- Produces:
  ```ts
  export function litCount(top: number, viewport: number, words: number): number;
  export function lightStatement(p: HTMLElement): { update(viewport: number): void; stop(): void };
  ```
  - `litCount` follows the preview: `sq = clamp((viewport - top) / (viewport * 0.9))`, and the result is `Math.round(clamp((sq - 0.25) / 0.6) * words)`.
  - `lightStatement` wraps each word of `.st2`, including the words inside `.quiet`, in `<span class="w">`, keeping the spaces and the `.quiet` wrapper. It sets `data-live` on the section.
  - `update` toggles `.lit` on the first `litCount(...)` words. CSS under `[data-live]` dims `.w` to `opacity: .14` and makes `.w.lit` fully opaque, with a 0.3 s transition.
  - `stop()` restores the paragraph's original `innerHTML` and removes `data-live`.
  - `live.ts` calls `update` from the same rAF as the evening, never from its own listener.

- [ ] **Step 1: Write `tests/statement.test.ts`:**
  - `litCount(1000, 1000, 20)` is 0.
  - `litCount(-2000, 1000, 20)` is 20.
  - `litCount` never exceeds `words` and is never negative, sampled over `top` from −3000 to 3000.
  - After `lightStatement` on the built statement paragraph, `textContent` is unchanged and the `.quiet` span still exists. The `.w` count equals the number of words in "One sentence a day about someone you love. Kept sealed until they write theirs.".
  - After `stop()`, `innerHTML` equals the original.
- [ ] **Step 2: Extend `tests/copy.test.ts`.** Every `aria-label="…"` and `alt="…"` value in `dist` has no em or en dash, no `!` and no plain spelling `Moyi`.
- [ ] **Step 3: Run** them. Expected: the statement tests FAIL. The copy extension should pass already; if it fails, fix the offending string.
- [ ] **Step 4: Implement** `statement.ts`, wire it into `live.ts`, make the two CSS tidy-ups, and add the README "Motion" section. That section covers:
  - what live mode is;
  - that it never runs under reduced motion;
  - where the timeline numbers live (`timeline.ts`, spec §5);
  - that canvases are stand-ins replaced by video in slice 5.
- [ ] **Step 5: Run** `npm run check && npm test && npm run test:headers`. Expected: all pass.
- [ ] **Step 6: Commit** `feat: the statement lights up word by word, and slice 2 tidy-ups`.
- [ ] **Step 7: The look (controller, in a real browser, with the live CSP under `wrangler pages dev dist`).**
  - **Sizes:** check at 1920, 1280, 1100×600 and 390 (a 390 px iframe from a header-free local server).
  - **Scroll positions:** scrub through `p` = 0, 0.15, 0.25, 0.33, 0.55, 0.75, 0.9 and 0.97, then compare each with the preview's option 4.
  - **What to look for at each position:**
    - the headline never over a phone;
    - never two screens in one phone;
    - the single phone gone before the split opens;
    - one phone after the merge;
    - captions readable;
    - no console errors, and in particular no CSP violations.
  - **Reduced motion:** turn it on in DevTools rendering emulation. The four still frames should return without a reload.
  - **No JavaScript:** load the page with JS disabled. It should match slice 2.
  - **Fast jumps:** fling to the bottom, press End, then follow the "Get the app" link. Each should land in a clean state.
