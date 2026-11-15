# moyi-web Slice 2: the home page, static, Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the holding page at `/` with the direction 4 home page in its final layout. "The evening" is shown as four still frames, which is also the permanent fallback for reduced motion and for no JavaScript (spec §6.6).

**Architecture:**
- Plain Astro components and one stylesheet per component group. The home page ships **no JavaScript** in this slice.
- The phone and its four screens are HTML and CSS (spec §6.2). Each `<Phone>` renders all four views, with every view except the current one `hidden`, so slice 3 can swap them without new markup.
- Footage does not exist yet. A `<Scene>` paints a CSS stand-in for each scene. Slice 3 adds the canvas and slice 5 the video, both inside the same component.
- Store links come from one config module with a per-store "live" flag (spec §5, last paragraph).

**Tech Stack:** unchanged from slice 1 (Node 22.23.5, Astro 7.4.4, TypeScript 6.0.3, Vitest 4.1.12, jsdom 30.1.3, Wrangler 4.156.1), plus `rsvg-convert` (Homebrew librsvg) used once to render the favicon PNGs.

**Spec:** `docs/superpowers/specs/2026-11-15-moyi-website-design.md`, slice 2 of §10. The look comes from `preview/moyi-directions.html`, option 4 (`OPT[4]` and its CSS); where the two disagree on the look, the preview wins, and on behaviour, security or copy, the spec wins.

## Global Constraints

Everything in slice 1's Global Constraints still binds (pinned versions, no third parties, no inline code, dark only, copy rules, fonts per page group, Newsreader 400 and 500 only, 48 px targets, 2 px `--ink` focus outline). In addition:

- **Branch.** All work on `feat/slice-2`, cut from `main` at `6542ef8`. One commit per task.
- **Astro stays at 7.4.4.** Every newer release (7.4.5 onward, from 2026-11-02) is under two weeks old today. Re-check at slice 3.
- **Porting the preview.** Copy the option 4 look, translating these preview conventions:
  - `cqi` units become `vw`, and `var(--vh)` becomes `100svh`;
  - weight 300 becomes 400 in `--ink-muted` (or `rgba(255,255,255,.8)` over a scene);
  - every `<em>` becomes `<span class="quiet">`. No italics anywhere;
  - the preview's phone breakpoint (container width under 700 px) becomes `@media (max-width: 699px)`;
  - the preview's `.grain` (a `data:` SVG) and the "Footage stand-in" tag are **not** ported. `img-src 'self'` blocks `data:` URLs.
- **Copy is exactly the strings in this plan**, which come from the preview v7 and spec §5. The four FAQ answers are draft: each carries `data-copy="draft"` (spec §8, "marked DRAFT for Daniel to approve").
- **No new CSP.** The home page keeps the slice 1 `HOME` policy. Nothing in this slice needs a script, so no `<script>` appears in `dist/index.html`.
- **Links to pages that arrive in slice 4** (`/privacy`, `/terms`, `/data-processing`, `/support`, `/delete-account`) are written now and 404 until then.
- **Store links** are the only absolute URLs allowed in an `href`. They must start with `https://apps.apple.com/` or `https://play.google.com/`. No `src` may ever be absolute.

## Review Focus

1. **Text over a scene that a person cannot read.** White and quiet text over the lightest part of any scene stand-in, under its scrim, must reach 4.5:1. Owned by Task 2 (`tests/contrast.test.ts`).
2. **A store flipped to live with no URL or no badge file** would ship a dead button or a broken image. The build must fail instead. Owned by Task 1 (`tests/stores.test.ts`).
3. **Two phone screens visible at once.** In every phone, exactly one view lacks `hidden`. Owned by Task 2 (phone markup test) and checked again in Task 3 for every phone on the page.
4. **The hero at 390 px wide.** The headline, the line under it and the badges or "coming soon" text must fit with no horizontal scroll, and must not sit on the phone. Owned by Task 5 (browser check at 390 and 1280).
5. **A draft FAQ answer shipping silently.** Exactly four elements carry `data-copy="draft"`, and they are the four answers. Owned by Task 4.

---

### Task 1: Site chrome, store config and icons

**Files:**
- Create:
  - `src/config/stores.ts`
  - `src/components/StoreButtons.astro`, `src/components/TopBar.astro`, `src/components/Footer.astro`
  - `src/styles/home.css` (shared home rules: `.wrap`, `.eyebrow`, headings, `.quiet`, top bar, footer, store buttons)
  - `scripts/make-icons.sh`, `public/favicon.svg`, `public/favicon-32.png`, `public/favicon-16.png`, `public/apple-touch-icon.png`, `public/robots.txt`
- Modify: `src/layouts/Base.astro` (icon links), `tests/build-output.test.ts` (store-link allowance)
- Test: `tests/stores.test.ts`

**Interfaces:**
- **Produces `src/config/stores.ts`:**
  ```ts
  export type Store = { live: boolean; url: string; badge: string; label: string };
  export const STORES: { apple: Store; google: Store };
  export function comingSoonLine(appleLive: boolean, googleLive: boolean): string | null;
  ```
  - `STORES.apple` = `{ live: false, url: '', badge: '/badges/app-store.svg', label: 'Download on the App Store' }`
  - `STORES.google` = `{ live: false, url: '', badge: '/badges/google-play.png', label: 'Get it on Google Play' }`
  - `comingSoonLine(false, false)` = `"Coming soon to the App Store and Google Play."`; `(true, false)` = `"Coming soon to Google Play."`; `(false, true)` = `"Coming soon to the App Store."`; `(true, true)` = `null`.
- **Produces `StoreButtons.astro`.** Props `{ id?: string }` (the closing section passes `id="get"`). For each live store it renders `<a class="store" href={url}><img src={badge} alt={label} height="48"></a>`. Then, if `comingSoonLine(...)` is not null, a `<p class="soon">` with that line. With both stores pending (today) the whole block is the one line of text.
- **Produces `TopBar.astro`.** No props. `<header class="topbar">`: `<a class="brand" href="/">` with the ọ mark and "Mọyì"; `<nav aria-label="Main">` with "How it works" → `#how`, "Privacy" → `/privacy`, "Support" → `/support` (hidden under 700 px); and `<a class="get" href="#get">Get the app</a>`.
- **Produces `Footer.astro`.** No props. Links Privacy `/privacy`, Terms `/terms`, Data processing `/data-processing`, Support `/support`, Delete account `/delete-account`; then `<a href="mailto:hello@getmoyi.app">hello@getmoyi.app</a>` and "© 2026 Mọyì".
- **Base.astro** gains, on every page: `<link rel="icon" href="/favicon.svg" type="image/svg+xml">`, `<link rel="icon" href="/favicon-32.png" sizes="32x32">`, `<link rel="icon" href="/favicon-16.png" sizes="16x16">`, `<link rel="apple-touch-icon" href="/apple-touch-icon.png">`.

- [ ] **Step 1: Write the failing tests** in `tests/stores.test.ts`:
  - `comingSoonLine` returns the four values above;
  - `for each store in STORES that is live`: `url` starts with its store's origin (`https://apps.apple.com/` or `https://play.google.com/`), and `public${badge}` exists. With both pending, this loop has no cases, so also assert that the test sees both stores;
  - `dist/index.html` contains `Coming soon to the App Store and Google Play.` exactly twice (hero and close), and `id="get"`.
- [ ] **Step 2: Run** `npm test`. Expected: FAIL, `src/config/stores.ts` not found.
- [ ] **Step 3: Implement** the config, the three components and `home.css`, porting `.snav`, `.stores`, `.store`, `.closing .foot` from the preview. The coming-soon line is 15 px system font in `--ink` (or white over a scene), not a button.
- [ ] **Step 4: Icons.** `scripts/make-icons.sh` writes `public/favicon.svg` (the mark from `Brand.astro` in `#F8EFE9` on a `#171313` rounded square, viewBox square) and renders the three PNGs from it with `rsvg-convert -w N -h N`. Commit the outputs. `public/robots.txt`:
  ```
  User-agent: *
  Allow: /
  ```
- [ ] **Step 5: Update `tests/build-output.test.ts`.** "no third-party references" keeps failing any absolute `src`, but allows an `href` that starts with `https://apps.apple.com/` or `https://play.google.com/`. Add a test that `dist/favicon-32.png`, `dist/favicon-16.png` and `dist/apple-touch-icon.png` exist and are PNGs (first bytes `89 50 4E 47`).
- [ ] **Step 6: Wire into `index.astro` temporarily:** `<TopBar/>`, the existing holding `<main>` content, `<StoreButtons/>` once in the main and `<StoreButtons id="get"/>` above `<Footer/>`. (Task 3 replaces the main.)
- [ ] **Step 7: Run** `npm run check && npm test`. Expected: 0 errors, all tests pass.
- [ ] **Step 8: Commit** `feat: home chrome, per-store launch flag and icons`.

### Task 2: The phone and the scene stand-ins

**Files:**
- Create: `src/components/Phone.astro`, `src/styles/phone.css`, `src/components/Scene.astro`, `src/styles/scenes.css`
- Modify: `vitest.config.ts`
- Test: `tests/phone.test.ts`, `tests/contrast.test.ts`

**Interfaces:**
- **Produces `Phone.astro`.** Props:
  ```ts
  { view: 'today' | 'write' | 'wait' | 'reveal'; time?: string; date?: string;
    partner?: string; mine?: string; theirs?: string; size?: 'centre' | 'pane' }
  ```
  - Defaults: `time '9:41'`, `date 'Sat 15 Nov'`, `partner 'Tunde'`, `mine "You waited up so I wouldn't walk home alone."`, `theirs 'You called my mum on her birthday before I remembered.'`, `size 'centre'`.
  - Root: `<div class="dev dev--{size}" role="img" aria-label={label}>`, then `.scr` with the island, status bar (the time) and four `<div class="v" data-view="…">` views, in the order today, write, wait, reveal. Every view except `view` carries `hidden`.
  - View content, from the preview's `phone()`:
    - today: date, "Archive", "Bond"; label "Today"; "Not yet written for today."; "One true sentence is enough."; button "Write";
    - write: "Cancel", "Write"; "Something small they did this week."; the `mine` text in full; button "Send";
    - wait: date, "Archive", "Bond"; "Today"; `mine`; "Written. You'll see {partner}'s when it's ready.";
    - reveal: "Your day is open."; a card labelled `partner` with `theirs`; a card labelled "You" with `mine`.
  - `label` is `"The Mọyì app. "` followed by: today `"Today: not yet written."`, write `"Writing: {mine}"`, wait `"Written, waiting for {partner}."`, reveal `"Your day is open. {partner}: {theirs} You: {mine}"`.
  - `phone.css` ports `.dev`, `.scr`, `.isl`, `.sb`, `.v`, `.an`, `.lb`, `.en`, `.st`, `.gr`, `.pa`, `.ec` from the preview, minus `.glass` animation and `.car`. `.v[hidden]` must be `display: none`. `.dev--centre` is `--pw: min(300px, 34svh)` (210 px / 26svh under 700 px). `.dev--pane` is `--pw: min(250px, 28svh)` (`min(140px, 16svh)` under 700 px).
- **Produces `Scene.astro`.** Props `{ name: 'sky-afternoon' | 'sky-dusk' | 'sky-night' | 'lagos' | 'rain' | 'lamp' | 'bed' }`. Renders `<div class="scene scene--{name}" aria-hidden="true"></div>` followed by `<div class="scrim" aria-hidden="true"></div>`. The parent positions both with `position: absolute; inset: 0`.
- **`scenes.css` format** (the contrast test parses it, so keep exactly this shape):
  - per scene, custom properties `--scene-{name}-1`, `--scene-{name}-2` and optionally `-3`, each a 6-digit hex, declared in `:root`;
  - `.scene--{name}` paints a `linear-gradient` from those stops (imagery, allowed by spec §6.10). Take the hues from the preview's canvas scenes (golden afternoon, dusk, night with windows, Lagos dusk, London rain, lamplit room, bedside), darkened as far as the contrast test needs;
  - one `--scrim-alpha` (a number from 0 to 1) in `:root`; `.scrim` is `rgba(14, 10, 10, var(--scrim-alpha))` as a flat layer. Footage cards keep the preview's bottom-up fade on top of it.

- [ ] **Step 1: Write `tests/phone.test.ts`.** Render with Astro's container API (`experimental_AstroContainer` from `astro/container`) and parse with jsdom. Vitest must compile `.astro` files for this, so change `vitest.config.ts` to `export default getViteConfig({ test: { include: ['tests/**/*.test.ts'] } })` with `getViteConfig` from `astro/config`, and confirm every existing test still passes. For each of the four `view` values:
  - exactly one `.v` lacks `hidden`, and its `data-view` equals `view`;
  - the root has `role="img"` and the label above;
  - `partner: 'Amara'` with `view: 'wait'` shows "Written. You'll see Amara's when it's ready.".
- [ ] **Step 2: Write `tests/contrast.test.ts`.** Read `src/styles/scenes.css`, collect every `--scene-*` hex and `--scrim-alpha`. For each stop, blend `rgb(14,10,10)` over it at `--scrim-alpha`, then assert the WCAG contrast ratio is at least 4.5 for `#FFFFFF` and for white at 0.8 alpha blended onto that colour. Also assert at least 14 stops were found, so the parse cannot pass vacuously.
- [ ] **Step 3: Run** `npm test`. Expected: both new files FAIL.
- [ ] **Step 4: Implement** `Phone.astro`, `phone.css`, `Scene.astro` and `scenes.css`.
- [ ] **Step 5: Run** `npm run check && npm test`. Expected: all pass.
- [ ] **Step 6: Commit** `feat: the phone in code and the scene stand-ins`.

### Task 3: The evening, as four still frames

**Files:**
- Create: `src/components/Evening.astro`, `src/styles/evening.css`
- Modify: `src/pages/index.astro`
- Test: `tests/home.test.ts`

**Interfaces:**
- Consumes `Phone`, `Scene`, `StoreButtons`, `TopBar` (Tasks 1 and 2).
- **Produces `Evening.astro`.** `<section id="how" class="evening" aria-label="How it works">` holding four `<div class="frame" data-frame="1…4">`, each at least `100svh` tall, stacked. Slice 3 turns this section into the pinned scene. `TopBar` sits absolutely over frame 1.

| Frame | Scene | Content |
|---|---|---|
| 1 | `sky-afternoon` | Eyebrow "Daily gratitude, for two"; `<h1>` "Write before you read."; `<p>` "One short thing about each other, every day." then a line break, then "Your day opens when you both have."; `<StoreButtons/>`. Centred, as `.o2t` / `h1.h4` (118 px max on desktop, 56 px on phones). No phone in this frame |
| 2 | `sky-dusk` | Caption (`.o2c`): "Lagos", time "21:40", "Amara writes one true sentence about Tunde."; a step label "Amara writes"; `<Phone view="write" time="21:40"/>` centred |
| 3 | two halves: `lagos` and `rain` | Left (top on phones): "Lagos · Amara", time "21:42", `<Phone view="wait" size="pane" time="21:42"/>`. Right (bottom): "London · Tunde", time "20:42", `<Phone view="write" size="pane" time="20:42" partner="Amara" mine="You called my mum on her birthday before I remembered." theirs="You waited up so I wouldn't walk home alone."/>`. A 1 px seam between them. Step label "Tunde writes" |
| 4 | `sky-night` | `<Phone view="reveal" time="23:10"/>`; caption "Lagos 23:10 · London 22:10" and "Your day is open. Both of you, at the same moment."; step label "Read together" |

- The caption sits left of the phone on desktop and under it on phones (the preview's `.o2c` and its phone rule). Nothing overlaps the phone at 390 or 1280 px.

- [ ] **Step 1: Write `tests/home.test.ts`** against `dist/index.html` with jsdom:
  - exactly one `h1`, with text "Write before you read.";
  - the page text contains "Write before you read." and "Your day opens when you both have." (the promise line, spec §8);
  - four `[data-frame]` elements, in order 1 to 4, inside `#how`;
  - every `.dev` on the page has exactly one `.v` without `hidden`, and the visible views are, in document order, `write`, `wait`, `write`, `reveal`;
  - no `<script` in the file.
- [ ] **Step 2: Run** `npm test`. Expected: FAIL.
- [ ] **Step 3: Implement** `Evening.astro` and `evening.css`; set `index.astro` to `<Base title="Mọyì: daily gratitude, for two" description="Write before you read. One short thing about each other, every day. Your day opens when you both have." fonts>` with `<TopBar/>`, `<main><Evening/></main>`, and the Task 1 closing stores and footer below.
- [ ] **Step 4: Run** `npm run check && npm test`. Expected: all pass.
- [ ] **Step 5: Commit** `feat: the evening as four still frames`.

### Task 4: Statement, For two, Private by construction, Questions, Close

**Files:**
- Create: `src/components/Statement.astro`, `src/components/ForTwo.astro`, `src/components/Private.astro`, `src/components/Questions.astro`, `src/components/Close.astro`, `src/styles/sections.css`
- Modify: `src/pages/index.astro`
- Test: extend `tests/home.test.ts`

**Interfaces:**
- Consumes `Scene`, `StoreButtons`, `Footer`.
- Copy, word for word:
  - **Statement** (`.o2s .st2`): "One sentence a day about someone you love." then `<span class="quiet">Kept sealed until they write theirs.</span>` Fully shown (the word-by-word light-up is slice 3).
  - **ForTwo** (`.for2`): eyebrow "For two"; `h2` "Whoever your one person is."; three cards numbered 1 to 3: "My partner" / "Across the room, or across the world."; "My close friend" / "The one you would call first."; "My family" / "A sibling, a parent, a cousin. Both of you 18 or over."; then "Lagos and London, or Lisbon and Los Angeles. Mọyì keeps one shared day for both of you, whatever the time zones say."
  - **Private** (`.o4v .vc`): eyebrow "Private by construction"; `h2` "Made for two people, and only two."; three cards, each with its `<Scene>`:
    - wide, `lamp`: label "Just the two of you"; struck-through pills in `<ul aria-label="Things Mọyì does not have">` with `<s>` "Read receipts", "Last seen", "Typing dots", "Followers", "A feed"; `h3` "Two people. Nobody else."; "No audience, and no sign of who opened the app or when. Leave a bond at any time, with no questions.";
    - `rain`: label "Kind to missed days"; the week of dots `role="img" aria-label="A week with six days written and one missed"`, days M T W T F S S with Thursday hollow (a ring, not a colour); `h3` "Miss a day. Nothing is lost."; "Only the streak count resets. Nobody is told, and nobody is waiting on you.";
    - `bed`: label "Honest about privacy"; `h3` "Your words stay yours."; "No ads, and your words are never sold. Entries are not end to end encrypted, and we explain why in plain words."; link "Read the privacy page" → `/privacy`.
  - **Questions** (`.faq`): eyebrow "Questions"; `h2` "Before you download."; four `<details class="qa">`, the first `open`, summaries and answers exactly as the preview's option 4 (time zones; if one of us stops writing; can Mọyì read our entries; how do I delete my account). Each answer `<p>` carries `data-copy="draft"`.
  - **Close** (`.closing`): `h2` "I know your worth."; `<p class="yo" lang="yo">Mo mọ ìyì rẹ.</p>`; `<StoreButtons id="get"/>`; `<Footer/>`.

- [ ] **Step 1: Extend `tests/home.test.ts`:**
  - section order in `main`: `#how`, then the statement, For two, Private, Questions and Close, by a `data-section` attribute on each (`statement`, `for-two`, `private`, `questions`, `close`);
  - every copy string above appears in the page text;
  - exactly four `[data-copy="draft"]`, all inside `details.qa`;
  - the first `details.qa` has `open`, the other three do not;
  - every `a[href]` on the page is one of `/`, `#how`, `#get`, `/privacy`, `/terms`, `/data-processing`, `/support`, `/delete-account`, `mailto:hello@getmoyi.app`, or a store URL.
- [ ] **Step 2: Run** `npm test`. Expected: FAIL.
- [ ] **Step 3: Implement** the five components and `sections.css`; compose them in `index.astro` in the order above. Remove the holding page's copy and the temporary Task 1 wiring.
- [ ] **Step 4: Run** `npm run check && npm test && npm run test:headers`. Expected: all pass; the header check still reports 15 routes ok.
- [ ] **Step 5: Commit** `feat: the rest of the home page`.

### Task 5: Weight, README and the look

**Files:**
- Modify: `tests/build-output.test.ts`, `README.md`
- Test: `tests/build-output.test.ts`

- [ ] **Step 1: Weight test.** Sum the bytes of `dist/index.html`, every stylesheet and script it links, and both font files. Assert the total is under 150 KB (spec §6.5).
- [ ] **Step 2: Run** `npm test`. Expected: PASS (if it fails, the cause is a real regression; fix it, do not raise the limit).
- [ ] **Step 3: README.** Add a "Home page" section: the four frames are the fallback for reduced motion and no JavaScript; how to flip a store live (set `live` and `url` in `src/config/stores.ts`, add the official badge file under `public/badges/`); the four FAQ answers are draft until Daniel approves them, and removing `data-copy="draft"` is part of that approval; icons are regenerated by `scripts/make-icons.sh`.
- [ ] **Step 4: Commit** `docs: the home page, its launch flag and its draft copy`.
- [ ] **Step 5: The look (controller, in the browser, not an implementer).** Under `wrangler pages dev dist`, at 1280 and 390 px wide: each frame and section against the preview's option 4; no horizontal scroll; no caption, headline or label on a phone; the coming-soon line legible on the sky; every FAQ opens and closes from the keyboard; no console errors (the live CSP is on). Note any deviation in the PR.
