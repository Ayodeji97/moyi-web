# getmoyi.app: the store-launch website

Date: 2026-11-15 · Owner: Daniel · Status: approved direction ("lock in 4"), design doc awaiting approval

The approved look is live in the preview artifact <https://claude.ai/artifact/6fLT6AQWN8U2VbF3Y9iaNY>, tab **4 · Best of 2 and 3**, version 7. Its source is `preview/moyi-directions.html` in this repo. Where this document and the preview disagree on how something looks, the preview wins. Where they disagree on behaviour, security or copy rules, this document wins.

## 1. Intent

Mọyì is about to reach the App Store and Google Play. On launch day, getmoyi.app has to do three jobs:

1. **Make someone who lands there want the app, in a few seconds.** That means showing the daily loop itself (write, wait, read together), not describing it.
2. **Satisfy store review.** Apple and Google both require a privacy policy URL and a support URL, and Google Play requires a web page for account deletion. The backend already links to `/terms`, `/privacy` and `/data-processing`, which return 404 today.
3. **Keep doing what the current site does.** The pages that the emails and invite links land on (`/verify`, `/reset-password`, `/i/<code>`) and the app-link files must keep working.

**Rulings from Daniel (2026-11-15):**
- The first reader is someone deciding whether to download the app ("store-launch readiness").
- Site now, web app later at `app.getmoyi.app`. D-11 (no web client) stands, so the backend does not change.
- Visual direction **4, "One evening, two cities"**, chosen over directions A to G and 1 to 3 after four rounds of previews.
- **No italic text** anywhere on the site. A quieter second line uses weight and colour instead.
- The hero headline is only **"Write before you read."**

## 2. Goals, non-goals, anti-goals

**Goals**
- A home page that shows one evening of the daily loop, driven by scroll, on desktop and phone.
- Every page the stores and the backend need, at the addresses already in use.
- A Lighthouse score of 95 or above on mobile, and WCAG 2.2 AA in the one theme we ship.
- A structure that keeps app.getmoyi.app possible later without reworking this site.

**Non-goals (not in this project)**
- The web app, sign-in, or any call to the API.
- A blog, a waitlist, a newsletter, testimonials, press logos or ratings (none exist yet).
- Translations. The routes leave room for them, but nothing is translated.
- The final legal text. The pages ship marked **DRAFT** until Daniel or a lawyer approves the text.

**Anti-goals (a build that technically works but does any of these has failed)**
- Any cookie, analytics or third-party request. The site's own privacy must match what it claims.
- Text over moving footage that a person cannot read.
- A headline, caption or phone sitting on top of another phone, or two phone screens visible through each other. These are the faults Daniel rejected in direction G.
- Copy that pressures: no urgency, no guilt, no "your partner is waiting", no exclamation marks, no em or en dashes.
- A page that breaks, or shows nothing, when animation is turned off or JavaScript fails.

## 3. Approaches considered

**Visual direction.** Daniel saw ten directions, all at desktop and phone width: A Letter, B Facing pages, C Lamp, D Paper, E Daily loop, F Kinetic, G Film, 1 Lamplight, 2 Day into night, 3 Two cities. He chose **4**, a blend he asked for of 2 (one evening sky, one centred phone) and 3 (Lagos and London side by side). The research behind the choice:
- Cleo, Awwwards Site of the Day, May 2026: a phone rising over full-bleed footage.
- Extra: a 2.2 MB hero video with the app screen built into it, kept readable by a gradient scrim.
- Bevel and Opal: short screen recordings swapped as you scroll.
- Apple's iPhone pages: footage that plays as you scroll.

**How to build it.** My call, since Daniel handed me the how.

| Approach | Trade-off | Verdict |
|---|---|---|
| **Astro, static output, on Cloudflare Pages** | Ships no JavaScript except what a page asks for. Components are plain HTML and CSS, so the design tokens map one to one onto CSS custom properties. Content collections fit versioned legal pages, and i18n routing exists for later | **Chosen** |
| Hand-written HTML (what `moyi-backend/site/` is now) | Fine for 5 pages. Painful at about 12 pages that share a layout, legal versioning and a scroll engine | Rejected |
| Next.js or SvelteKit | Far more JavaScript than a marketing page needs, and harder to keep within a strict CSP. The future web app should be its own app either way | Rejected |
| A GSAP or Lenis scroll library | About 60 to 90 KB, and Lenis takes over native scrolling. One small scroll engine of our own covers the five moments this page has | Rejected; write our own (§6.3) |

## 4. The site map

| Route | Purpose | Notes |
|---|---|---|
| `/` | The home page (§5) | |
| `/privacy`, `/terms`, `/data-processing` | Legal pages the backend already links to | Written in Markdown, versioned as in §6.9. A **DRAFT** banner until the text is approved. Text from planning documents `20` §1 and `09` §144; it must say plainly that entries are not end to end encrypted |
| `/support` | Store support URL (FR-102) | `hello@getmoyi.app` and short answers. No form |
| `/delete-account` | Google Play's deletion URL | How to delete in the app, how to ask by email, and what is deleted and when (from the deletion ADRs) |
| `/verify`, `/reset-password`, `/i/<code>` (served by `/invite`), `/404` | The functional pages | **Ported so they behave exactly as they do now** (§7) |
| `/.well-known/apple-app-site-association`, `/.well-known/assetlinks.json` | App links | Copied byte for byte from `moyi-backend/site/.well-known/` |
| `/robots.txt`, `/sitemap.xml`, favicon set, Open Graph image | | The ọ mark: 16 and 32 px, SVG, and 180 px for Apple touch |

## 5. The home page (direction 4, preview v7)

Dark throughout. Section by section, in order:

1. **Top bar.** The ọ mark and "Mọyì" on the left. "How it works", "Privacy" and "Support" in the middle, hidden on phones. A "Get the app" pill on the right that scrolls to the closing store buttons.
2. **The evening.** A pinned section four screens tall. One scene; everything inside it is driven by scroll position `p` from 0 to 1.

   | `p` | What happens |
   |---|---|
   | 0 to 0.07 | Golden afternoon sky. Eyebrow "Daily gratitude, for two", the headline **"Write before you read."**, the line "One short thing about each other, every day. Your day opens when you both have.", then the App Store and Google Play badges. The headline fades out by 0.07 |
   | 0.08 to 0.20 | The phone rises into the centre, only after the headline has fully gone. Today: "Not yet written for today." |
   | 0.13 to 0.27 | The sky turns to dusk. A caption on the left shows Lagos and a clock running from 17:30 to 21:40. On the phone, Amara writes "You waited up so I wouldn't walk home alone." The button reads "Sending" |
   | 0.26 to 0.30 | The phone leaves completely, before the split opens |
   | 0.30 to 0.37 | The sky splits from the middle: left and right on desktop, top and bottom on phones. Lagos at dusk with Amara's phone ("Written. You'll see Tunde's when it's ready."), and London in the rain with Tunde's phone. Each half is labelled with its city, its person and its own clock, one hour apart |
   | 0.44 to 0.66 | Tunde writes "You called my mum on her birthday before I remembered." and sends |
   | 0.72 to 0.80 | The halves close back into one night sky, with windows lit |
   | 0.82 to 0.94 | One phone returns: "Your day is open", Tunde's entry then Amara's appearing in turn. Caption: "Lagos 23:10 · London 22:10. Your day is open. Both of you, at the same moment." |

   On desktop, a step list on the right (Amara writes · Tunde writes · Read together) marks the current step. On phones, a thin three-part progress line under the top bar does the same job.
3. **Statement.** "One note a day for someone you love, sealed until they write theirs." (one sentence; the quiet half begins at "sealed") (shortened and worded by the owner, 2026-11-16; was "One sentence a day about someone you love. Kept sealed until they write theirs.") The words light up one by one as it scrolls into view; the second sentence sits in the muted colour.
4. **For two.** Removed (owner, 2026-11-16); its photo files were deleted.
5. **Private.** Centred "Made for only two people." (owner, 2026-11-16) with "No ads, and your words are never sold." (the age line was removed by the owner, 2026-11-16; the 18+ rule belongs on Terms) Three equal cards, each a title, a line, then rows of plain fact on hairlines: Just the two of you (Read receipts, Last seen, Typing dots, each struck and "None"); Kind to missed days ("Miss a day. Nothing is lost.", the week of dots, "Only the streak count resets. Nobody is told, and nobody is waiting on you."); Honest about privacy ("Your words stay yours.", Ads None, Your words sold Never, Encryption Not end to end). One centred button: "Read the privacy page".
6. **Questions.** Moved off the home page to its own page, `/faq` (owner, 2026-11-16): h1 "FAQs", line "Before you download.", the same four questions and answers, **all closed** on load. Linked from the top bar and the footer ("FAQs"). On `/faq` the top bar and footer send `#how` and `#get` back to `/`. Content CSP (fonts, no media).
7. **Close.** "I know your worth." with "Mo mọ ìyì rẹ." under it, the two store badges, and then the footer: the mark and "Daily gratitude, for two."; three columns (Mọyì: How it works, Questions. Help: Support, Delete account, hello@getmoyi.app. Legal: Privacy, Terms, Data processing); a bar with "© 2026 Mọyì" and "No ads. Never sold." The brand and its line share one row. No wordmark (owner, 2026-11-16). On the home page the footer rises in once as it enters view (brand, links, bar, 120 ms apart; none under reduced motion or without JS). There is no second "Get the app" link: the floating pill is the only one. On phones only the brand centres (the mark, its line beneath); the links keep two columns, centred as one block with equal space either side, and the bar its row (owner, 2026-11-16).

**Before launch, one config flag** swaps both sets of store badges for the text "Coming soon to the App Store and Google Play." The flag can be per store, since the two stores may approve on different days.

## 6. How it is built

### 6.1 Repository and stack
- `moyi-web` is its own git repository: Astro (current major), TypeScript strict, no UI framework.
- It deploys to Cloudflare Pages. Daniel creates the GitHub repository and the Pages project himself, with me guiding (§10).
- Tokens live in `src/styles/tokens.css`, copied from the design system's `references/tokens.md` (Rosewood). A copy of `tokens.md` is kept in this repo at `design/tokens.md`, with a note of the planning-corpus commit it came from. A test fails if `tokens.css` differs from that copy. Re-syncing the copy from the corpus is a manual step, run whenever the corpus changes (the corpus has no remote, so CI cannot read it).
- Newsreader is self-hosted as WOFF2 subsets made from the app's TTF files (SIL OFL). UI text uses the system font stack. No Google Fonts.

### 6.2 Phone screens are drawn in code
The phone and its four screens (Today, Write, Written-waiting, Your day is open) are HTML and CSS built from the tokens, as in the preview. They are not screen recordings. This keeps them sharp at every size, light, editable when app copy changes, and translatable later. The screens use the app's real strings. The sample entries are written for the site and are clearly not real users' words.

### 6.3 Scroll engine
One small module of our own, about 3 KB, written in TypeScript:
- One passive scroll listener plus one `requestAnimationFrame`.
- Progress for each pinned section is `(scrollY - top) / (height - viewportHeight)`, clamped to 0 to 1, with `position: sticky` for the pin.
- Each section declares its moments as ranges of `p`, as in the table in §5.
- **Screen swaps are strict.** The outgoing view fades out before the incoming one fades in, so two screens are never both visible.
- Transforms and opacity only, nothing that triggers layout.

### 6.4 Footage
Each scene (`sky`, `lagos`, `rain`, `lamp`, `bed`) is a `<Scene>` component:
- **When a clip exists**, it renders a muted, looping, `playsinline` `<video>` with a poster image. The sky clip is not looped: its time follows scroll.
- **When no clip exists yet**, it renders the canvas stand-in from the preview.

So the site can launch before the footage is ready, and each clip drops in by adding a file. **No app screen is laid into a clip.** The footage cards use their clips as they are: a dark or softly lit phone is fine, and nothing is tracked or composited in perspective. Only the centred and split phones show app screens, and those are drawn in code (§6.2). `footage-prompts.md` is to be updated to match. Shot prompts and the shot list are in `preview/footage-prompts.md`: the sky is shot 3, Lagos 4, London 5, the lamplit room 1, the bedside 6.
- **AI generation is acceptable only for clips without people**, such as the sky.
- **Clips with people are filmed or licensed**, with signed releases. They are never generated.

### 6.5 Weight limit
- Under about 6 MB in total on a phone's first full scroll, and under 150 KB of HTML, CSS, JS and fonts before media.
- Every clip has a poster image and a separate phone-sized cut. Clips load only when their section is within one screen of view.
- The sky clip is under 2.5 MB at 720p. The others are under 1.5 MB.
- Once the page is off screen, canvases and videos pause, and they pause whenever the tab is hidden.

### 6.6 Reduced motion and no JavaScript
- With `prefers-reduced-motion`, the pinned evening becomes **four still frames**, stacked: the afternoon with the headline; Amara writes; the two cities; the day is open. Nothing scrubs and no clip plays; posters are shown instead.
- Without JavaScript, the page shows those same four frames. Store links, the questions and every link work without JavaScript.

### 6.7 Content-Security-Policy
The home page needs a script, video and fonts, so it gets the current policy plus `font-src 'self'; media-src 'self'`. Every other page keeps today's policy exactly. Nothing loads from another origin, so there is no third-party request anywhere on the site.

### 6.8 Fonts and the policy per page
- **Home, legal, support and delete-account pages:** they get `font-src 'self'`, so Newsreader loads from our own origin. That adds no third party and costs no privacy.
- **The functional pages (`/verify`, `/reset-password`, `/invite`, `/404`):** they keep today's policy exactly, with no fonts. They use the system font only, with headings in the system serif stack. ADR-0018's "fetch nothing" stays literally true there.
- **On Cloudflare Pages:** when two `_headers` rules match a route, both policies are sent and the browser enforces the stricter one. So each route group sets its own policy, and the `/*` rule carries the other headers and the strict policy, and each content route detaches it (`! Content-Security-Policy`) and sets its own. Unknown paths therefore keep the strict policy and can never go out without one.
- **The shared layout must look right without Newsreader.** A test checks that the policy header on each route matches this table.

### 6.9 Legal versions and the backend's consent records
- **One version label, the same on both sides.** The label printed on a legal page is exactly the string the backend records at acceptance, the `MOYI_LEGAL_*_VERSION` value (ADR-0056: at most 40 of `A-Z a-z 0-9 . _ -`). Its format is the effective date, `YYYY-MM-DD`, for example `2026-12-01`.
- **Every version stays readable for good.** The current version is at `/terms`, and each version also lives at `/terms/<version>`; `/privacy` and `/data-processing` work the same way. A consent record never names text nobody can read.
- **Until the text is approved,** the pages go live with the DRAFT banner and the label `unpublished`, matching the backend.
- **Release order at launch:**
  1. Daniel (or a lawyer) approves the text.
  2. The page is published under its dated label.
  3. The backend's env is set to that label.
  4. Then, and only then, the app goes to store review.

  A privacy page marked DRAFT is never what a store reviewer sees.

### 6.10 Design-system exception
`moyi-design-system` §5 bans scroll-driven choreography and parallax. That rule was written for the app. By choosing direction 4, Daniel has ruled that **the website is exempt, and only the website**. The exception is to be recorded in the design-system skill in the planning corpus, as its own small change. Everything else in the design system applies to the site: Rosewood, no accent colour, Newsreader for headings, no pink, red, gradient fills or glass on content, and the copy rules.

The sky's own colour change, and the dark fade behind text on footage, are imagery, not interface colour, and so are allowed.

## 7. The functional pages, unchanged in behaviour

These are ported from `moyi-backend/site/`. Each must pass the same checks as now:
- `default-src 'none'`, `no-store` on `/verify`, `/reset-password`, `/i/*` and `/invite`, and `Referrer-Policy: no-referrer`.
- Nothing is fetched, and there is no lookup on the invite page (ADR-0018, T-06).
- `/i/:code` rewrites to `/invite` with a 200.
- `link.js` keeps its letters, digits, `-` and `_` rule.
- Both `.well-known` files are served as `application/json` and never redirected.

What these pages *say* stays as it is in this project; only the styling moves to Rosewood. What they should tell a real user depends on the app's link-routing PR (moyi-app), which is owed separately.

## 8. Copy rules for this site

- **Voice:** a close friend, not a brand.
- **Banned:** em and en dashes, exclamation marks, urgency, guilt and italics. CI greps for the first two.
- **Required:** the promise line "Write before you read. Your day opens when you both have." appears in full on the home page, split between the headline and the line under it.
- **The name** is always spelled Mọyì in text. Moyi is acceptable only in URLs and code.
- **Every string** comes from the preview as approved, or is marked DRAFT for Daniel to approve. Nothing new ships unreviewed.

## 9. Verification

- **Build:** `astro check` and `npm run build`, with zero type errors.
- **Headers:** compare the preview deployment's headers against today's site with curl, page by page (§7).
- **Real links:** from the backend's local profile, a verification email link and an invite link both open correctly on the preview deployment.
- **Accessibility:**
  - axe with zero violations;
  - text contrast measured over the darkest and lightest frames of every footage scene;
  - keyboard-only use;
  - VoiceOver on iOS Safari;
  - 200% zoom;
  - reduced motion shows the four frames.
- **Performance:** Lighthouse mobile 95 or above, and the weight limit measured with DevTools on a throttled phone profile.
- **Look:** screenshots at 390 and 1280 px at `p` = 0, 0.25, 0.55, 0.97 for the evening, and for each later section. Compare them with the preview, and check for any overlap of headline and phone.

## 10. Slices (one PR each, each independently reviewed)

1. **Scaffold and functional pages.**
   - Astro, tokens, fonts, layout, `_headers`, `_redirects`, `.well-known`, the four functional pages and 404.
   - This slice alone can replace `moyi-backend/site/` at cutover.
2. **Home page, static.** Every section in final layout, with the evening shown as the four still frames.
3. **The evening in motion.** Scroll engine, phone screens, canvas scenes, the split and merge, and the progress line and step list.
4. **Legal, support and delete-account pages.** All carry DRAFT banners.
5. **Footage drop-in.** `<Scene>` video support, posters, lazy loading and the weight check, as clips arrive.

**Cutover is Daniel's to run, with me guiding.**
1. Create the GitHub repo and push.
2. Create the Cloudflare Pages project.
3. Check the `*.pages.dev` deployment against §9.
4. Move the custom domain.
5. Retire `moyi-backend/site/` in a backend PR.

## 11. Calls made after the builder check
The builder check asked four questions. Each is settled above as my call, for Daniel to overrule when he reads this:
- the legal version label, the permanent addresses for each version, and the release order (§6.9);
- fonts and the policy per page (§6.8);
- no app screens composited into the footage cards (§6.4);
- the tokens copy and its check (§6.1).

## 12. Left to the builder
- Component boundaries and file layout inside Astro.
- Exact easing curves, and the fine-tuning of the `p` ranges, as long as §5's order and the rule "nothing overlaps, nothing ghosts" hold.
- The canvas stand-in code, ported from the preview and tidied.
- The badge artwork: Apple's and Google's official badges, in the variants their guidelines allow on a dark background.
- How the per-store "coming soon" flag is wired: env or config.

## 13. Owed by Daniel
- Approval of the FAQ answers and the draft legal text, or the lawyer's version of it.
- The footage: filmed, licensed or generated within §6.4's rule.
- Creating the GitHub repo and the Cloudflare Pages project at cutover.

**Glass bar (owner, 2026-11-16).** From the statement down, the top bar docks: fixed, frosted
(translucent surface + an 18px backdrop blur, near-solid where blur is unsupported), sliding down
as the statement passes 60% of the viewport and back up if the reader returns to the evening
scene. Above the statement it stays on the page as before. The pill keeps its spot in the bar and
never tucks while docked. Reduced motion: it appears and goes without a slide. This is the one
place the site uses a blur; the pill itself stays solid.

**Phone menu (owner, 2026-11-16).** At 699px and below, the centred nav is replaced by a 48px menu
toggle left of the pill: two lines that cross when open. It is a `<details>`, so it works without
JavaScript, and it holds the same four links. Its panel hangs 8px under the bar and moves with it (absolute,
so it scrolls with the bar on the page and rides the docked bar), on a solid raised surface, with the links set in Newsreader 24 on 56px rows. On home, `scripts/menu.ts` closes it on
a link, on Escape (focus returns to the toggle), on a tap outside and on widening past 699px.
Elsewhere its links are full navigations. Above 699px it is hidden.

**Slice 4, legal and help pages (2026-11-16).** `/privacy`, `/terms`, `/data-processing`, `/support`
and `/delete-account` are written in Markdown (`src/content/legal/`) and set by one layout
(`Doc.astro`): the centred head, a DRAFT notice, one 720px column, tables as hairline rows that
stack on phones. Legal pages carry the version `unpublished`, as the backend records until the
text is approved; the dated copies at `/<doc>/2026-12-01` are made at approval (6.9). The text
states what the backend does today (a cited fact sheet, 2026-11-16), not what the planning documents
promise: entries are not end to end encrypted and are plain text in the database, photos and voice
notes are not checked automatically, backups last up to 35 days, and the processors are Hetzner,
Cloudflare, Resend, Google FCM and Apple APNs. `/data-processing` is the plain summary
(ADR-0056 d3), not a DPA, and holds the public processor list (NFR-053).

**Phone menu, revised (owner, 2026-11-16).** The toggle takes the far right edge and the pill sits
8px to its left; both float (fixed) and tuck together. The panel is glass like the docked bar
(24px blur, near-solid fallback). To let it blur at all, the docked bar's glass moved to a
`::before` layer and the slide-ins hold no fill: an element with a backdrop-filter, or with an
animation still filling its end frame, is a backdrop root and the glass inside it blurs nothing.

**Sharing, sitemap, robots (2026-11-16).** Every indexable page carries a canonical link, Open Graph
and Twitter card tags from its own title and description, and one card image, `public/og.png`
(1200x630: the mark, "Write before you read." and the statement, on surface). The functional pages
are noindex and carry none, since their links hold tokens and codes. `/sitemap.xml` lists the seven
indexable pages (`src/pages/sitemap.xml.ts`), and robots.txt points to it. FAQ answer 4's path was
corrected to the app's real one: Bond settings, then Account, then Delete your account.

