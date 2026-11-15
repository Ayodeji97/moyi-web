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
