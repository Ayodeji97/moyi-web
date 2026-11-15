# moyi-web Slice 1: scaffold and functional pages, Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** An Astro static site that replaces `moyi-backend/site/` behaviour for behaviour: the same addresses, headers, redirect and app-link files, restyled in Rosewood. It is deployable on its own at cutover.

**Architecture:**
- Astro builds plain HTML files (`build.format: 'file'`), so `/verify` is `verify.html` exactly as today.
- Everything security-relevant is copied byte for byte into `public/`: `link.js`, `_redirects` and `.well-known/*`.
- `_headers` gains the per-route policy table from spec §6.8.
- Headers are verified against Wrangler's own Pages server, not against a re-implementation of its rules.

**Tech Stack:** Node 22.23.5 (fnm, `.node-version`), Astro 7.4.4, TypeScript 6.0.3, @astrojs/check 0.9.12, Vitest 4.1.12, jsdom 30.1.3, Wrangler 4.156.1, fontTools (Python, used only to subset fonts).

**Spec:** `docs/superpowers/specs/2026-11-15-moyi-website-design.md`. This plan is slice 1 of §10. Slices 2 to 5 get their own plans once this one merges.

## Global Constraints

- **Pinned versions.** Every dependency is pinned to an exact version (no `^` or `~`), each at least two weeks old on the day it is pinned. `package-lock.json` is committed. Astro 7 needs Node ≥ 22.23.4, so `.node-version` is `22.23.5`.
- **No third parties.** Nothing on any page loads from another origin: no CDN, no Google Fonts, no analytics.
- **No inline code.** No inline `<style>`, no `style=""` attribute, no inline `<script>` and no `on*=` attribute in any built HTML. The policy is `style-src 'self'; script-src 'self'`. Set `build.inlineStylesheets: 'never'`.
- **Dark only.** The site uses Rosewood dark values only, with `color-scheme: dark` (the home page is dark throughout; the other pages match it). There is no accent colour, and an underline is used only on things that navigate.
- **Copy.**
  - No em or en dashes, no exclamation marks and no italics in visible text.
  - The name is written **Mọyì** in visible text; `moyi` survives only inside the shell commands and URLs.
  - What the functional pages say is today's wording, with only the name's spelling changed.
- **Fonts per page group.**
  - The functional pages (`/verify`, `/reset-password`, `/invite`, `/404`) never reference `/fonts/`. They use the system UI font, with headings in `ui-serif, Georgia, serif`.
  - Only pages under the content and home policies load Newsreader.
- **Newsreader weights.** The app ships only weights 400 and 500 (`newsreader_regular.ttf`, `newsreader_medium.ttf`). The site uses those two only, and a "quieter line" means 400 in the muted colour (the preview's 300 maps to this).
- **Touch targets** are at least 48 px. Focus is visible as a 2 px `--ink` outline.
- **Branching.** All work happens on branch `feat/slice-1`, cut from `docs/website-design`, with one commit per task. Nothing is committed to `main`.

## Review Focus

1. **A malformed token or code** (shell metacharacters, a broken `%` escape, more than 128 characters, empty) must show the "link looks incomplete" panel, never a command. Owned by Task 3.
2. **An unknown address** (`/no-such-page`) must get the 404 page under the *strict* policy, never a looser or missing one. Owned by Task 4.
3. **Astro silently inlining** a small stylesheet or script, which the policy then blocks in production, leaving a broken, unstyled page. Owned by Task 3, which runs the build-output scan over every page.
4. **An invite code** with lowercase letters must be shown in upper case. One with a trailing slash (`/i/abc/`) shows the incomplete panel, exactly as today. Owned by Task 3.
5. **Either `.well-known` file** must be served with status 200, `application/json` and no redirect. Apple refuses a redirected file, and then universal links fail silently. Owned by Task 4.

---

### Task 1: Scaffold, tokens and the holding page

**Files:**
- Create:
  - `.node-version`, `package.json`, `package-lock.json`, `astro.config.mjs`, `tsconfig.json`, `vitest.config.ts`, `.gitignore`, `README.md`, `.github/workflows/ci.yml`
  - `design/tokens.md`, a byte copy of Gratitude `.claude/skills/moyi-design-system/references/tokens.md` at corpus commit `8047e46`. Its first line is a comment: `<!-- copied from the Gratitude planning corpus, .claude/skills/moyi-design-system/references/tokens.md @ 8047e46; re-copy when it changes -->`
  - `src/styles/tokens.css`, `src/styles/base.css`
  - `src/components/Brand.astro`, `src/layouts/Base.astro`, `src/pages/index.astro`
- Test: `tests/tokens.test.ts`

**Interfaces:**
- **Produces `Base.astro`.** Props: `{ title: string; noindex?: boolean; fonts?: boolean; description?: string }`.
  - It renders `<html lang="en">`, charset, viewport, `<title>{title}</title>`, `<meta name="robots" content="noindex">` when `noindex`, and `<link rel="stylesheet" href="/fonts/fonts.css">` when `fonts`, plus the imported `tokens.css` and `base.css`.
  - The body is a `<slot/>`.
- **Produces `Brand.astro`.** No props. It renders the ọ mark (an SVG ring of r 14.5 with stroke 4.5, and a dot of r 4 below it, viewBox `0 0 40 52`, `aria-hidden="true"`) followed by the text `Mọyì`, in `<p class="brand">`.
- **Produces CSS custom properties:** `--surface --surface-raised --ink --ink-muted --outline --outline-strong --danger`, plus the type scale `--fs-entry: 34px; --fs-title: 26px; --fs-body: 16px; --fs-small: 13px`.
- **Produces npm scripts:**
  - `dev`, `build` (`astro build`) and `check` (`astro check`);
  - `test` (`astro build && vitest run`);
  - `test:headers` (defined in Task 4).

- [ ] **Step 1: Set up the toolchain.**
  - Run `fnm install 22.23.5 && fnm use 22.23.5`, write `.node-version`, and run `npm init -y`.
  - Install exact devDependencies `astro@7.4.4 typescript@6.0.3 @astrojs/check@0.9.12 vitest@4.1.12 jsdom@30.1.3 wrangler@4.156.1` with `--save-exact`.
  - Set `"type": "module"` and `"private": true`.
  - `astro.config.mjs`:
    ```js
    export default defineConfig({
      site: 'https://getmoyi.app',
      output: 'static',
      trailingSlash: 'never',
      build: { format: 'file', inlineStylesheets: 'never' },
    });
    ```
  - `tsconfig.json` extends `astro/tsconfigs/strict`.
  - `.gitignore`: `node_modules/ dist/ .astro/ .wrangler/`.
- [ ] **Step 2: Write the failing test `tests/tokens.test.ts`.**
  - It parses every row of `design/tokens.md` that matches ``/^\| `(\w+)` \|[^|]*\| `(#[0-9A-F]{6})` \| `(#[0-9A-F]{6})` \|$/m`` and takes the dark (third) column.
  - It parses `src/styles/tokens.css` for `--([a-z-]+):\s*(#[0-9A-Fa-f]{6})`.
  - It maps camelCase to kebab-case (`surfaceRaised` → `surface-raised`).
  - Test `every Rosewood token matches the design system copy`: exactly 7 tokens are parsed, and each CSS value equals its dark value, compared case-insensitively. For example `surface` is `#171313`, `ink` is `#F8EFE9` and `danger` is `#D4857C`.
- [ ] **Step 3: Run `npx vitest run tests/tokens.test.ts`.** Expected: FAIL, because `tokens.css` does not exist.
- [ ] **Step 4: Write `tokens.css`, `base.css`, `Brand.astro`, `Base.astro` and the holding `index.astro`.**
  - `tokens.css` holds the seven dark values and the type scale. `base.css` sets `color-scheme: dark`, the body background `--surface`, colour `--ink`, the system UI stack at 16/1.55, a centred `main` of max 34rem with `padding: 3rem max(16px, env(safe-area-inset-left))`, and focus-visible.
  - `index.astro` uses `Base` with title `Mọyì` and `fonts`. It ports today's `index.html` text:
    - h1: "A private gratitude journal for two."
    - "Each of you writes one thing a day. Neither reads the other's until both have written."
    - "Not open to the public yet."

    The h1 is set in Newsreader (`font-family: "Newsreader", ui-serif, Georgia, serif`). Slice 2 replaces this page.
- [ ] **Step 5: Run the checks.** Run `npx vitest run tests/tokens.test.ts && npm run check && npm run build`. Expected: PASS, 0 errors, and `dist/index.html` exists.
- [ ] **Step 6: Add CI and the README.**
  - `.github/workflows/ci.yml` runs on pull requests and pushes: checkout, `actions/setup-node` with `node-version-file: .node-version`, `npm ci`, `npm run check`, `npm test`, `npm run test:headers`. Task 4 makes `test:headers` exist; until then CI is red on that step only, and that is expected.
  - `README.md` covers what the repo is, the slices (link the spec), `npm run dev`, and that `design/tokens.md` is re-copied by hand from the corpus.
- [ ] **Step 7: Commit.**
  ```bash
  git add -A && git commit -m "feat: Astro scaffold, Rosewood tokens and holding page"
  ```

### Task 2: Self-hosted Newsreader

**Files:**
- Create: `scripts/subset-fonts.sh`, `scripts/check-font-glyphs.py`, `public/fonts/newsreader-400.woff2`, `public/fonts/newsreader-500.woff2`, `public/fonts/fonts.css`, `public/fonts/OFL.txt`
- Test: `tests/build-output.test.ts` (created here; Task 3 extends it)

**Interfaces:**
- Consumes: `Base.astro`'s `fonts` prop (Task 1).
- Produces: the font family name `"Newsreader"` at weights 400 and 500, with `font-display: swap`, available to any page that passes `fonts`.

- [ ] **Step 1: Write the failing test `tests/build-output.test.ts`.**
  - It reads `dist/`.
  - Test `home loads the self-hosted fonts`: `dist/index.html` contains `href="/fonts/fonts.css"`.
  - Test `fonts.css declares both weights from our own origin`: `dist/fonts/fonts.css` has two `@font-face` blocks with `font-weight: 400` and `500`, `src: url("/fonts/newsreader-400.woff2")` and `-500`, and no `http`.
  - Test `font files are small`: each woff2 exists and is under 80 KB.
- [ ] **Step 2: Run `npm test`.** Expected: FAIL, because the fonts are missing.
- [ ] **Step 3: Write `scripts/subset-fonts.sh`.**
  - It creates a venv in `$TMPDIR`, runs `pip install fonttools==4.* brotli`, then runs `pyftsubset` on `../moyi-app/shared/designsystem/src/commonMain/composeResources/font/newsreader_{regular,medium}.ttf` with `--flavor=woff2 --layout-features='kern,liga' --unicodes=U+0020-007E,U+00A0-00FF,U+0131,U+0152-0153,U+02C6,U+02DA,U+02DC,U+0300-0304,U+0323,U+1E00-1EFF,U+2018-201F,U+2026,U+2032-2033,U+20AC`.
  - Its output goes to `public/fonts/newsreader-{400,500}.woff2`.
  - Run it once and commit the outputs.
  - Copy Newsreader's licence to `OFL.txt`, from the app repo if it is present there; otherwise write the standard SIL OFL 1.1 text naming "Newsreader Project Authors".
- [ ] **Step 4: Write `scripts/check-font-glyphs.py <woff2>...`.** Using fontTools, it asserts that each font's cmap contains U+1ECD (ọ), U+00EC (ì), U+1EB9 (ẹ), U+1EB8 (Ẹ), U+0323 (combining dot below) and U+2019 (’). It exits non-zero and names the missing code points.
  - Run `python3 scripts/check-font-glyphs.py public/fonts/*.woff2` inside the same venv. Expected: `ok` for both files.
- [ ] **Step 5: Write `public/fonts/fonts.css`** with the two `@font-face` rules (family `Newsreader`, `font-display: swap`).
  - Run `npm test`. Expected: PASS.
- [ ] **Step 6: Commit.**
  ```bash
  git add -A && git commit -m "feat: self-host Newsreader 400 and 500 as subset WOFF2"
  ```

### Task 3: The functional pages

**Files:**
- Create:
  - `public/link.js`: a byte copy of `moyi-backend/site/link.js`. Its sha256 must be `edf3c34d646ba523b3a3169f6b8cbae5d73603aec69c0e50b219be4fe67dfc9d`.
  - `src/components/LinkPage.astro`, `src/styles/functional.css`
  - `src/pages/verify.astro`, `src/pages/reset-password.astro`, `src/pages/invite.astro`, `src/pages/404.astro`
- Modify: `tests/build-output.test.ts`
- Test: `tests/link.test.ts`, `tests/copy.test.ts`

**Interfaces:**
- **Consumes:** `Base.astro` (never with `fonts`) and `Brand.astro`.
- **Produces `LinkPage.astro`.** Props: `{ kind: 'verify' | 'reset' | 'invite'; heading: string; note: string }`, plus a named slot `intro`, because the verify intro contains `<code class="inline">`.
  - It renders `<body data-link={kind}>`, with `Brand`, `<h1>{heading}</h1>` and `<div id="found">` containing:
    - the intro paragraph;
    - two `.card`s: a `Code` card with `<code id="value">` and `<button type="button" data-copy="value">Copy code</button>`, and a `Command` card with `<code id="command">` and `<button type="button" data-copy="command">Copy command</button>`;
    - `<p class="note">{note}</p>`.
  - Then `<div id="missing" hidden>`, holding today's incomplete-link paragraph verbatim, and today's `<noscript>` paragraph verbatim.
  - Last comes `<script is:inline src="/link.js"></script>`, which keeps it a plain external tag that Astro does not bundle.

  The element ids and attributes are the contract `link.js` reads, so they must match exactly.

- [ ] **Step 1: Write the failing test `tests/link.test.ts`.** For each case, load the built page with `new JSDOM(html, { url, runScripts: 'outside-only' })`, stub `navigator.clipboard`, then `window.eval(readFileSync('dist/link.js'))`:

  | Test | Page | URL | Expected |
  |---|---|---|---|
  | `verify shows the token and command` | `dist/verify.html` | `https://getmoyi.app/verify?token=abc_DEF-123` | `#value` is `abc_DEF-123`, `#command` is `scripts/moyi verify abc_DEF-123`, and `#missing` is hidden |
  | `reset shows its command` | reset | `?token=X1` | `scripts/moyi reset-password X1` |
  | `invite upper-cases the code` | `dist/invite.html` | `https://getmoyi.app/i/k7qx2m` | `#value` is `K7QX2M`, `#command` is `scripts/moyi bond join K7QX2M` |
  | `shell metacharacters show the incomplete panel` | verify | `?token=$(rm%20-rf)` | `#found` is hidden, `#missing` is not hidden, `#command` is empty |
  | `a broken escape shows the incomplete panel` | invite | `/i/%E0%A4%A` | `#missing` is shown |
  | `a trailing slash shows the incomplete panel` | invite | `/i/abc/` | `#missing` is shown |
  | `129 characters is too long` | verify | `token=` plus `a` repeated 129 times | `#missing` is shown, while 128 characters shows the value |
  | `no token` | verify | no query | `#missing` is shown |

- [ ] **Step 2: Extend `tests/build-output.test.ts`, then write `tests/copy.test.ts`.**
  - **Build-output tests:**
    - `link.js is the backend's byte for byte`: its sha256 equals the value above.
    - `no inline code anywhere`: every `dist/**/*.html` has no `<style`, no ` style=`, no `<script` without `src=`, and no ` on[a-z]+=` attribute.
    - `no third-party references`: no `src=` or `href=` value in any `dist/**/*.html` starts with `http:` or `https:` or `//`.
    - `functional pages carry no fonts and are noindex`: `verify.html`, `reset-password.html`, `invite.html` and `404.html` contain `content="noindex"` and do not contain `/fonts/`.
    - `functional pages keep the link.js contract`: each of the three link pages has `data-link="verify|reset|invite"` respectively, `id="found"`, `id="missing" hidden`, `id="value"`, `id="command"`, exactly two `data-copy=` buttons, and `<script src="/link.js">`.
  - **`tests/copy.test.ts`:** strip tags from every built page and assert:
    - no `—` or `–`;
    - no `!`, with the doctype excluded by stripping;
    - no `/\bMoyi\b/`, case-sensitive;
    - `verify.html` contains `Confirm your email`, `invite.html` contains `You have been invited to a Mọyì bond`, and `reset-password.html` contains `Choose a new password`.
- [ ] **Step 3: Run `npm test`.** Expected: FAIL, because the pages do not exist.
- [ ] **Step 4: Copy `link.js` and write `LinkPage.astro`, `functional.css` and the four pages.**
  - **Copy** is today's text from `moyi-backend/site/*.html` with `Moyi` changed to `Mọyì`:
    - **verify:** title `Confirm your email · Mọyì`, intro "Your confirmation code is below. Run the command in a terminal, from the `moyi-backend` folder, to confirm this address.", note "Opening this page confirmed nothing yet: it only shows you the code."
    - **reset:** title `Choose a new password · Mọyì`, intro "Run the command below. It asks for your new password twice and never shows it.", note "This code works once and expires soon. If you did not ask to reset your password, ignore it: nothing changes until the command is run."
    - **invite:** title `You have been invited to a Mọyì bond · Mọyì`, heading "You have been invited to a Mọyì bond", intro "Your partner sent you this invite code. Sign in first, then run the command below to join their bond.", note "The code works once. Opening this page did not use it."
    - **404:** title `Not found · Mọyì`, h1 "Nothing here", "If you followed a link from an email, open it again from the email itself."

    Each page passes its intro paragraph through the `intro` slot.
  - **`functional.css`:**
    - h1 is `--fs-title` in `ui-serif, Georgia, serif`; paragraphs are `--ink-muted`.
    - `.card` is `--surface-raised` with a 1 px `--outline` border, radius 12 px and padding 16 px.
    - `code` is monospace on `--surface`, with `user-select: all` and `overflow-wrap: anywhere`.
    - Buttons are pills with min height 48 px, a 1 px `--outline-strong` border, `--ink` text and a transparent background. There is no fill and no underline, since they act in place rather than navigate.
    - `.brand` sets the ọ mark at 18 px beside `Mọyì` in the serif stack.
- [ ] **Step 5: Run `npm test`.** Expected: PASS, every test.
- [ ] **Step 6: Look at the pages.**
  - Run `npm run build && npx wrangler pages dev dist --port 8788`.
  - Open `/verify?token=abc_DEF-123`, `/i/k7qx2m`, `/reset-password?token=X1` and `/no-such-page` at 390 px and 1280 px in a browser.
  - Click both copy buttons.
  - Expected: Rosewood dark, nothing clipped, a visible focus ring when tabbing, "Copied" shown on the button, and no console errors (CSP violations would appear there).
- [ ] **Step 7: Commit.**
  ```bash
  git add -A && git commit -m "feat: port the verify, reset, invite and 404 pages"
  ```

### Task 4: Headers, redirect and app-link files

**Files:**
- Create:
  - `public/_headers`
  - `public/_redirects`: a byte copy of the backend's file (sha256 `cc3fb993ff7a6e195e1f6a40139801ceab4f979ee634ad2f81fe384cda8b6af7`)
  - `public/.well-known/assetlinks.json` (sha256 `e84e7845c7d70232d1803ff854243a621b66c9fa36ab5fae285383b88cd437aa`) and `public/.well-known/apple-app-site-association` (sha256 `66ab7a51dc292075aab0e5067e6767fcc643477df65d450a5f8869aeb6191e68`)
  - `scripts/headers-table.mjs`, `scripts/check-headers.mjs`, `scripts/run-header-check.mjs`
- Modify: `package.json` (the `test:headers` script) and `tests/build-output.test.ts`

**Interfaces:**
- **Produces `scripts/headers-table.mjs`.** It exports `STRICT`, `CONTENT`, `HOME` (policy strings) and `ROUTES: Array<{ path: string; csp: string; noStore: boolean; json?: boolean }>`. The live check consumes it now; slice 2 to 5 checks will too.
- **Produces `scripts/check-headers.mjs <baseUrl>`.** It fetches every route with `redirect: 'manual'`, asserts its headers, prints one line per route and exits non-zero on any failure. Usable against `wrangler pages dev` now, and against the `*.pages.dev` preview at cutover (spec §9).

- [ ] **Step 1: Write `scripts/headers-table.mjs` with these exact values.**
  ```js
  export const STRICT  = "default-src 'none'; script-src 'self'; style-src 'self'; img-src 'self'; base-uri 'none'; form-action 'none'; frame-ancestors 'none'";
  export const CONTENT = "default-src 'none'; script-src 'self'; style-src 'self'; img-src 'self'; font-src 'self'; base-uri 'none'; form-action 'none'; frame-ancestors 'none'";
  export const HOME    = "default-src 'none'; script-src 'self'; style-src 'self'; img-src 'self'; font-src 'self'; media-src 'self'; base-uri 'none'; form-action 'none'; frame-ancestors 'none'";
  ```
  `ROUTES`:
  - **HOME:** `/`.
  - **CONTENT:** `/privacy`, `/terms`, `/terms/2026-12-01`, `/data-processing`, `/support`, `/delete-account`. These are 404 until slice 4; only their headers are checked.
  - **STRICT with noStore:** `/verify?token=a`, `/reset-password?token=a`, `/invite`, `/i/ABC123`.
  - **STRICT:** `/no-such-page`.
  - **STRICT with json:** `/.well-known/assetlinks.json` and `/.well-known/apple-app-site-association`.

  Every route also expects `Referrer-Policy: no-referrer`, `X-Content-Type-Options: nosniff` and `X-Frame-Options: DENY`.
- [ ] **Step 2: Write `scripts/check-headers.mjs`.** For each route, assert:
  - the `content-security-policy` value equals the expected string exactly, so a doubled or comma-joined policy fails;
  - `cache-control` contains `no-store` exactly when `noStore`;
  - `json` routes have status 200, `content-type` starting with `application/json`, and no `location` header;
  - `/i/ABC123` has status 200, and its body contains `data-link="invite"` (the rewrite is not a redirect).

  Add the npm script `"test:headers": "npm run build && node scripts/run-header-check.mjs"`. `run-header-check.mjs` spawns `wrangler pages dev dist --port 8788`, waits until `http://localhost:8788/` answers (30 s timeout), runs the check against it, kills Wrangler and exits with the check's code.
- [ ] **Step 3: Run `npm run test:headers`.** Expected: FAIL, because there is no `_headers` yet.
- [ ] **Step 4: Write the files.**
  - **`public/_headers`:**
    - `/*` sets the STRICT policy plus the three common headers, with today's comment kept.
    - `/` and each CONTENT path, plus `/terms/*`, `/privacy/*` and `/data-processing/*`, each carry `! Content-Security-Policy` followed by `Content-Security-Policy: <CONTENT or HOME>`.
    - The no-store blocks and the two `.well-known` content-type blocks are kept verbatim from the backend's file, with their comments.
  - Copy `_redirects` and both `.well-known` files byte for byte.
- [ ] **Step 5: Run `npm run test:headers`.** Expected: every route prints `ok`, and the exit code is 0.
  - **If Wrangler does not honour detach followed by set in one block** (CONTENT routes show no policy, or two), **stop and report it.** Do not drop the `/*` policy: an unknown address must never go out without one (Review Focus 2).
- [ ] **Step 6: Add a test `well-known files are the backend's byte for byte` to `tests/build-output.test.ts`.** It checks the sha256 of both files in `dist/.well-known/` against the values above, and that the sha256 of `dist/_redirects` matches the value above. Run `npm test`. Expected: PASS.
- [ ] **Step 7: Commit.**
  ```bash
  git add -A && git commit -m "feat: per-route security headers, invite rewrite and app-link files"
  ```

### Task 5: Slice verification and hand-off

**Files:**
- Modify: `README.md`, adding a "Checks" section that lists `npm test`, `npm run test:headers` and `node scripts/check-headers.mjs <url>`.

- [ ] **Step 1: Run the full suite from a clean tree.** Run `rm -rf node_modules dist && npm ci && npm run check && npm test && npm run test:headers`. Expected: 0 type errors, every test passing, and every header route `ok`.
- [ ] **Step 2: Compare against today's site.**
  - Run `npx wrangler pages dev ../moyi-backend/site --port 8789` alongside this site on 8788.
  - For `/verify?token=abc_DEF-123`, `/i/abc123`, `/reset-password?token=x` and `/.well-known/apple-app-site-association`, compare `curl -sI` from both servers. Expected: the same status, CSP, cache-control, referrer and content-type, except that Astro's pages differ in body.
  - Record the comparison in the PR description.
- [ ] **Step 3: Commit the README change.** Hand the branch to an independent whole-branch review against this plan and spec §7.
  ```bash
  git add README.md && git commit -m "docs: how to run the slice 1 checks"
  ```
