# moyi-web

The static website for the Mọyì app, served at https://getmoyi.app. It is an Astro site built to plain files, and it replaces the hand-written site in `moyi-backend/site/`.

## Slices

The site is built in slices. The design is in `docs/` (see the store-launch website spec, `docs/superpowers/specs/`), and slice 1 is the scaffold and the functional pages.

## Develop

```
npm ci
npm run dev
```

Node 22.23.5 (see `.node-version`). `npm run check` type-checks the site and the tests, and `npm test` builds and runs the tests.

`scripts/subset-fonts.sh` needs Python 3 and the sibling `../moyi-app` checkout.

## Checks

- `npm test` builds the site and runs the vitest suite.
- `npm run test:headers` starts `wrangler pages dev dist` on port 8788 (it refuses if the port is busy) and checks the security headers of every route.
- `node scripts/check-headers.mjs <url>` runs the same header check against a server that is already running, for example `node scripts/check-headers.mjs http://localhost:8788`.

## Design tokens

`design/tokens.md` is a copy of the design system's tokens from the Gratitude planning corpus. It is re-copied by hand when the corpus changes, and `tests/tokens.test.ts` checks that `src/styles/tokens.css` still matches it.

## Home page

The evening is told as four still frames. They are the fallback for visitors who prefer reduced motion and for visitors with no JavaScript, so the page reads in full without any script.

To make a store live, set `live` and `url` for that store in `src/config/stores.ts`, and add the official badge file under `public/badges/` at the path named in its `badge` field. Until then the page shows the coming-soon line for that store.

The FAQ answers are approved copy (2026-11-15). A change to them needs Daniel's approval again.

`scripts/make-icons.sh` regenerates the icons.

`npm test` also checks that the home page, its stylesheets, any scripts and both fonts total under 150 KB.

## Motion

Live mode is what the evening becomes when JavaScript runs and reduced motion is off: the four still frames turn into one pinned scene four screens tall, driven by scroll, and the statement paragraph lights up word by word. One module script starts it by setting `data-live` on `#how`; all the live CSS is scoped under `[data-live]`.

It never runs under reduced motion. If that setting turns on while the page is open, the engine tears itself down and the four still frames return exactly as built. With no JavaScript the page is slice 2's, unchanged.

It also stays on the still frames when the window is shorter than 480 px at load (a landscape phone, say), where the pinned scene would shrink the phone to almost nothing. That check runs once, at start: resizing past 480 px afterwards does not switch modes until the page is reloaded.

The timeline numbers (what happens at each scroll progress `p`) live in `src/scripts/evening/timeline.ts`, as the pure function `evening(p)`. Spec section 5 has the table they come from.

The canvases in the scenes are stand-ins for footage. Slice 5 replaces them with video.
