<!-- copied from the Gratitude planning corpus, .claude/skills/moyi-design-system/references/tokens.md @ 8047e46; re-copy when it changes -->
# Tokens

**Status: decided 2026-09-03.** The palette and the type scale below are settled values, not
proposals. They were chosen against rendered screens, and every ratio was measured with a contrast
function rather than estimated (`14` §6). The superseded proposals are in
`scratchpad/tokens-proposals-backup.md`.

Scope discipline from `14` §7.1 — a colour ramp, four type sizes, an 8 pt spacing scale, and a
small closed set of components. The original ceiling was six; it now stands at **ten**, and every
addition is recorded in §4. The ceiling is a discipline, not a number: every addition needs a
stated reason, and the first question is always whether it is a variant of something that exists.

---

## 1. Colour — "Rosewood"

**Dark is authoritative** (`14` §1 — most usage is at night, in bed). Light is derived from it.

**The accent was removed on 2026-09-03. Seven tokens plus `danger`, and no accent at all.** An audit
of all 50 accent bindings found it carried **no fill anywhere in the product**. Every live use was
secondary text: `StateBlock`'s action, `ComposeField`'s dismiss, `InviteCode`'s share, Archive's
month jump, Join's "Not now". Everything else was documentation chrome or the record of rejected
`PrimaryAction` explorations. `onAccent` had no live product use at all.

Colouring an action and nothing else is an affordance carried by **colour alone** — the NFR-104
anti-pattern rather than a use of an accent. Those actions are now `ink` with an underline, which is
a stronger affordance and survives greyscale. Documentation chrome moved to `inkMuted`, and the
archival exploration boards were frozen to literal colour so the rejection record survives.

**An underline means it goes somewhere. Settled 2026-09-07.** The underline is not decoration on a
secondary action — it is the affordance, and it therefore carries a promise: *this navigates*. A
value that opens an OS surface, or toggles in place, takes no underline, because it has no
destination. Bond settings had four rows underlined and unwired for exactly this reason: `Bond name`
navigates and now does, while `Reveal time`, `Your reminder` and `Rest days` do not navigate and
have lost the underline. The rule is testable, and `figma-drift-check.js` now tests the other half
of it — a label that reads as an action must sit inside something reactive.

**Inline links inside a sentence separate by value, not hue.** A link within body text is `ink`
where the sentence around it is `inkMuted`, plus an underline — two cues, neither of them a colour
the reader has to learn. That is the answer whenever someone asks for "a link colour": there isn't
one, and the value step does the work.

**Resolved 2026-09-04: no `onDanger` token is needed. Use `surface`.** `onAccent` had been doing
that job, and its removal left the question open. The Bond-settings leave confirmation is the first
real danger fill in the product, so it was measured rather than assumed: **`surface` on `danger` is
6.54:1 dark and 5.57:1 light**, both clear of 4.5. Dark is identical to the old `onAccent` figure
because `onAccent` dark and `surface` dark were the same value; light is 0.24 lower, since `surface`
light is `#FFF9F5` rather than pure white. Override the fill on the instance — there is no
destructive `PrimaryAction` variant, and there should not be one until a second use appears.

**Provenance.** The neutral ramp came from an external palette proposal and is kept intact — its
8% → 12% → 25% lightness stepping is deliberate and well spaced. That proposal also carried a coral
red accent (`#E87972` / `#C84F52`); it was first rotated to hue 54° and then removed altogether. The
reasoning is kept below because it constrains any future proposal to reintroduce one.

| Token | Role | Dark | Light |
|---|---|---|---|
| `surface` | App ground | `#171313` | `#FFF9F5` |
| `surfaceRaised` | Entry card, sheet | `#211A1A` | `#FFFFFF` |
| `ink` | Body and entry text | `#F8EFE9` | `#2A2020` |
| `inkMuted` | Dates, counters, secondary | `#CDBBB5` | `#695A57` |
| `outline` | Decorative hairline, divider | `#493737` | `#E9D8D1` |
| `outlineStrong` | Field and control borders | `#7E6A6A` | `#827270` |
| `danger` | Destructive confirm only | `#D4857C` | `#9D4E46` |

### Measured

| Pair | Dark | Light | Needs |
|---|---|---|---|
| `ink` on `surface` | 16.26:1 | 15.18:1 | 4.5 |
| `ink` on `surfaceRaised` | 15.09:1 | 15.84:1 | 4.5 |
| `inkMuted` on `surface` | 9.98:1 | 6.29:1 | 4.5 |
| `outlineStrong` on `surface` | 3.65:1 | 4.38:1 | 3.0 |
| `outlineStrong` on `surfaceRaised` | 3.39:1 | 4.58:1 | 3.0 |
| `outline` on `surface` | 1.65:1 | 1.32:1 | n/a — decorative |
| `danger` on `surface` | 6.54:1 | 5.57:1 | 4.5 |
| `danger` on `surfaceRaised` | 6.07:1 | 5.81:1 | 4.5 |

`outline` is a decorative hairline and is out of scope for WCAG 1.4.11. **Any border that is the
only thing identifying a control uses `outlineStrong`**, never `outline`. That distinction is why
there are seven colour tokens and not six.

### The accent, and why it is gone

**Red is spent.** `danger` is a muted red reserved for destructive confirmations — deleting a
revealed entry, leaving a Bond. It never appears on a streak surface (FR-076, `14` §3). With the
accent gone it is the only hue in the palette, which makes that reservation stricter rather than
looser: anything coloured now reads as destructive.

**The bar for reintroducing an accent.** Not red, pink or coral (`19` §6). It must clear 4.5:1 on
both `surface` and `surfaceRaised` in **both** modes. It must sit far enough from `danger`'s OKLCH
hue (26.9° dark / 27.3° light) not to be mistaken for it; the removed accent kept 27–32°. And it
must earn a job that is not "make this text look tappable", because an underline does that better.
Everything below is what a proposal has to beat.

**`danger` derived 2026-09-03.** Primitives `brick/400` `#D4857C` and `brick/600` `#9D4E46`. It sits at
OKLCH hue 26.9° / 27.3° against the accent's 54.4° / 59.7° — a 27–32° separation, and only 0.4° of drift
between its own two modes, tighter than the accent's 5.3°. Dark-mode chroma 0.099 is below the accent's
0.118, which is what "muted" means here. **No `onDanger` token is needed:** `onAccent` already passes on
both danger fills (6.54 dark, 5.81 light).

**Coral was re-proposed on 2026-09-03 and rejected again, with measurements.** `#C84F52` fails AA in
*all six* possible light-mode pairings — as text on `#FFF9F5` 4.28, on `#FFFFFF` 4.47, and with white
4.47 / linen 4.28 / near-black 4.12 / light-ink 3.54 on a coral fill. There is no passing text colour.
It is also red on the hue axis (21.7°, versus pure red at 29.2°), which `19` §6 rules out. And
`#E87972` sits **2.0° from `danger`** at contrast 1.00 — as an accent it would be visually identical to
the destructive colour.

**Material 3 dynamic colour stays off.** `13` §107 — the product has its own palette. Both the
`material-3` and `impeccable` skills will push dynamic colour; refuse.

### Historical: why the light accent was not simply a darker version of the dark one

The first light candidate was `#A85434`. It matched on chroma but sat at OKLCH hue **40.9°** against
the dark accent's **54.4°** — a 13.5° drift, running *toward* red, which is the direction `19` §6
warns about. `#9A6231` sits at **59.7°**, cutting the drift to 5.3°, and carries slightly less
chroma (0.097 vs 0.118) — which is correct rather than a compromise: a dark ground needs more chroma
to read at the same strength than a light one does.

Darkening a warm hue in sRGB shifts it, so the two modes will never match exactly. 5° is close
enough to read as one colour; 13° was not.

---

## 2. Type

**Entry text and wordmark: Newsreader.** Variable, with an optical-size axis (`opsz` 6–72,
`wght` 300–600), designed by Production Type for screen reading. One bundled file serves every
serif role with correct optical compensation — which also keeps the APK small (`14` §5).

**Everything functional: the platform system font.** SF on iOS, Roboto on Android, via
`expect`/`actual`. Not a bundled sans. Reasons, in order: it inherits Dynamic Type and font-scale
behaviour, which is what NFR-102's 200% requirement actually depends on; it costs zero bundle bytes
on both platforms; it falls back correctly for locales not planned for (`14` §5); and it disappears
better than any bundled face, because it is what the reader already sees all day. `impeccable`'s
own Android reference says the same: *"Roboto is the system face; theme a brand face in through the
type scale."*

Four sizes. Not five.

| Token | Use | Face | Size / line-height |
|---|---|---|---|
| `entry` | Entry text — the hero | Newsreader Regular (400) | **34 / 1.40** (47.6px line) |
| `title` | Screen titles; **also the preview-entry size** in Archive and collapsed rows | Newsreader Regular (400) | 26 / 1.25 |
| `body` | UI text, settings, explanations | System sans | 16 / 1.50 |
| `label` | Metadata, dates, counters, author labels | System sans | 13 / 1.40, uppercase, +0.11em |

**This Figma file is NOT a valid surface for 200 % font-scale testing.** Because bound tracking is
pixel-locked (below), text does not widen proportionally when the size is raised: the same string at
size 26 measures 359 pt under `PERCENT 11` but only 330 pt under `PIXELS 1.43` — Figma under-reports
width by 8 %. Figma will show a label fitting where the shipped `0.11em` will not. Verify 200 % on a
device, never on this canvas.

**Figma stores `label` tracking as `1.43 px`, not `11 %`.** Figma forces a *bound* `letterSpacing`
variable into pixel units — forcing PERCENT back silently drops the binding. Verified equivalent: the
same string renders 181 px under both `PERCENT 11` and `PIXELS 1.43`, while `PIXELS 11` renders 373 px.
**Compose and CSS must still express this as `0.11em`**, so it survives Dynamic Type and font scaling.
If `label/size` ever moves off 13, recompute the Figma value as `size × 0.11`.

`title` doing double duty as the preview-entry size is deliberate — it is what keeps the scale at
four sizes while still giving the Archive a smaller serif setting.

**The wordmark** is Newsreader Medium (500). It is an asset behind one token, not a type style, and
it is not a fifth size. It is deliberately the **only** unstyled text node in the Figma file.

### Text styles in the file — 4 product, 2 derived, 3 documentation

`entry` · `title` · `body` · `label` are the product scale. **`action`** is Newsreader at 16 — `body`
SIZE, serif FACE — for the `PrimaryAction` label. **`code`** is Newsreader at 26 with 28 % tracking —
`title` SIZE, serif FACE — for `Field`'s `Code` variant and `InviteCode`. Both bind the existing size
variables, so the scale is still four sizes: face and tracking are separate axes. **`doc/title`,
`doc/caption`, `doc/token`** are documentation chrome, namespaced so they can never be mistaken for
product tokens. Nothing outside `doc/` may use them.

**Nine styles, not eight.** This heading read "4 product, 1 action, 3 documentation" until
2026-09-04 and silently omitted `code`, which §4 has always referenced. Count the styles in the file
before trusting the sentence.

### Why 34 / 1.40

Chosen against a 499-character entry — one under the FR limit — set at phone measure, not against a
twelve-word sample. Larger settings with tighter leading (42 / 1.12 was proposed) look better in a
mockup and turn a maximum-length entry into several screens of scrolling. 1.12 is display leading;
`14` §1 asks for generous line height on entries, and 1.40 is reading leading.

**Test the scale at 500 characters, never at the sample.**

### The real measure is ~302 pt, not 356

Measured on a 390 pt phone frame: screen padding 20×2 plus card padding 24×2 leaves **302 pt**, which
sets **~20 characters per line** at 34 px. The 356 pt figure used earlier was the bare specimen width
and was optimistic; the Type page was corrected to 302 pt on 2026-09-03.

At the true measure the canonical 499-character specimen is **27 lines / 1286 px** — 13 % taller than
the 23 lines / 1095 px that 356 pt reported. At the true measure a 494-character entry is **26 lines / 1238 px**, and the
full reveal stack is 1475 pt against 658 pt of viewport — it **overflows by 817 pt, about 2.2 screens**.

At **200 % font scale it is ~10 screens, not 4.5** — measured, and corrected on 2026-09-03. Growth is
**4.5×, not 2×**, because doubling the size halves the characters per line *and* doubles the line height;
the two compound. 494 characters goes from 26 lines / 1238 px to **59 lines / 5617 px**. Any layout
reasoning that assumes 200 % costs 2× is wrong by more than double.

The narrow measure is a feature, not a cost: ~20 characters per line is what makes an entry read as
something written rather than something sent.

### One size, responsive container — decided 2026-09-03

The entry keeps **one** type size at every length. The *container* responds:

- **Fits the viewport** → the stack centres vertically. A short entry gains presence from whitespace.
- **Does not fit** → top-aligns and scrolls.

A three-bucket length-responsive scale (40–44 / 34–38 / 28–32) was proposed and rejected. Scaling type
by length makes length a visual signal — it tells both people the system is measuring their words, and
`01` §7.3 names feeling judged or manipulated as the product's most likely failure. It would also make
the reveal look different every night, against `14` §1's "a lamp being switched on in a quiet room",
and triple the 200 % test matrix.

If editorial scale is ever revisited: two sizes maximum, tied to measure rather than character count,
and **only at reveal — never in compose**, where watching your own text resize as you type fights the
counter.

### Scaling and glyph coverage

- `sp` on Android, Dynamic Type on iOS. Never fixed px.
- 34px is the 100% base. At 200% (NFR-102) that is 68px, and it must not truncate or overlap.
  This is the accessibility failure that most often ships — test it at design time.
- **Newsreader sets `Mọyì` correctly.** Verified present: `ọ` U+1ECD and `ẹ` U+1EB9 (via the
  U+1EA0–1EF9 range), combining dot-below U+0323, and combining grave U+0300. This was a real
  elimination criterion — Instrument Serif and Libre Baskerville were rejected because they carry
  none of these, and picking one would have decided `19` §3c's diacritics question by accident.
- Latin Extended is present for the prepared locales `pt-PT`, `fr`, `es`.
- Bundle only the weights in use: 400 for `entry` and `title`, 500 for the wordmark.

---

## 3. Spacing, radius, elevation

An 8 pt scale. `4` exists only for optical adjustment inside a component, never for layout.

**Screen rhythm, decided 2026-09-03: 24 between blocks, 16 inside a block.** A heading and its
supporting line are one block — they live in an `intro` frame at 16 — and every other thing on a
screen is separated by 24. Before this rule the onboarding flow mixed 16 and 24 at the same level
across screens, which an external review picked up as inconsistent vertical rhythm. It was: the
distinction was real but unstated, so it read as an accident.

`4 · 8 · 16 · 24 · 32 · 48 · 64`

**One derived exception: 12 pt inside the composer.** `ComposeField`'s text wrap and counter wrap use
12, which is not on the scale. It is not a spacing choice — it is geometry: half the difference
between a 48 pt touch target and the 24 pt glyph it centres, `(48 - 24) / 2`. It exists so the entry
text and the icon glyphs align optically at 20 pt from the box edge. Change the target size or the
glyph size and this value changes with them. Do not "fix" it to 8 or 16.

**Audited 2026-09-03 across 581 nodes.** Off-scale values found and removed: `itemSpacing` 10 and 20,
body text at 14 px, and corner radii of 5 and 8. Every fill, stroke and radius in the file now binds
to a variable. The single exception is the safe-area inset in `Scaffold` (iOS 59/34, Android 24/24),
which is an OS guarantee rather than a design token — inventing a spacing token for a notch would be
wrong.

**Radius:** 12, plus `full` for the avatar. Do not reach for `rounded-2xl`/`rounded-3xl` card
aesthetics — a known AI-slop tell, and it fights "warm, not sentimental".

**Elevation:** hairline `outline` first; shadow only where a surface genuinely floats. On a
dark-first palette shadows read poorly — prefer `surfaceRaised` over a shadow.

---

## 3a. Motion — decided 2026-11-08 (owner ruling, moyi-app #35)

Functional motion only: no bounce, overshoot, spring or decoration. The reveal keeps its own
values (`states.md` §5). Compose: `MoyiMotion`.

| Token | Value | Use |
|---|---|---|
| `motion.push` | 300 ms, `FastOutSlowIn` | Android shared axis X: 10 % horizontal shift with a fade through |
| `motion.push.ios` | 350 ms, cubic-bezier(0.2, 0.9, 0.1, 1) | iOS push: full-width slide, the screen below drifts one third |
| `motion.fadeIn` | 210 ms after a 90 ms delay, `LinearOutSlowIn` | The incoming screen of a fade through |
| `motion.fadeOut` | 90 ms | The outgoing screen of a fade through |
| `motion.crossFade` | 200 ms | Reduced motion: replaces every push |
| `motion.control` | 150 ms | A control changing state: label swap, dim, width |
| `motion.breathe` | 900 ms each way, alpha 1.0 to 0.55, repeating | A busy `PrimaryAction`'s label while it sends |

**Reduced motion:** iOS Reduce Motion turns pushes into `motion.crossFade` and stops the breath.
Android's "Remove animations" scales every Compose animation to nothing on its own.

## 4. The components

Derived from the seven screens in `14` §3. **All ten built and validated** — six on 2026-09-03,
plus `InviteCode` and `Field`. Each passed a binding audit: zero unbound padding, gap, radius, fill,
stroke or unstyled text, verified in both colour modes.

| # | Component | Slots / states |
|---|---|---|
| 1 | **EntryCard** | author label, text · own / partner / locked / tombstone. **Locked is a security boundary**: no text, no count, no timestamp, no media flag (BR-8 / T-01). No timestamp slot was built — a timestamp at reveal is a metric (`14` §3). *(Amended 2026-10-13, ADR-0037 question 9: no slot for a reaction either, which the API sends on every entry read in full; owed, with `states.md`)* |
| 2 | **ComposeField** | dismissible prompt slot, text, counter past 400, media affordances and counter **inside the box** (composer pattern), icon-only at 48 dp targets, **no send** — send is a `PrimaryAction` slot |
| 3 | **PrimaryAction** | one per screen, reachable one-handed · idle / sending / queued-offline / disabled |
| 4 | **DayCell** | streak calendar unit · complete / solo / frozen / missed / today — **each distinguished by shape and label, not colour alone** (NFR-104) |
| 5 | **StateBlock** | the empty / waiting / error / offline / solo / partner-pending layout — heading, one line, at most one action. Carries `copy.md`'s error shape. **Six variants, not four** — `Solo` (FR-063 auto-unlock) and `PartnerPending` were added after this row was first written |
| 6 | **Scaffold** | screen frame: insets, safe areas, title, back. Owns the platform deltas in SKILL.md §9 |
| 7 | **InviteCode** | the code shown to the creator while the partner has not accepted · idle / copied. Differentiates by **content, not styling**. **Copied is not optional** — a copy action with no visible result reads as broken and gets tapped again |
| 8 | **Field** | the one input control · `Text` / `Secure` / `Select` / `Code` / `Multiline` × `Idle` / `Focus` / `Error` / `Disabled`. **`Multiline` added 2026-09-05** for the support message body: `ComposeField` does not generalise (it is pinned to entry text, the 400-character counter and media affordances) and a 56 pt single-line field cannot hold a paragraph. It is a fifth *type*, not a size axis, so the set is 20 variants rather than 32; the box is 140 tall, top-aligned, and carries no trailing icon. Visible label always. **Focus and Error change stroke weight, not only colour** (NFR-104), and **Focus is `ink`, not `accent`** (2026-09-03) — 15.09:1 dark / 15.84:1 light, about 3x the accent it replaced, inverting by mode like `PrimaryAction`. There is no accent in the system to spend. 56 tall, 65 for `Code`. `Code` is one field with the `code` text style's tracking, **not six boxes** — six boxes announce as six controls, break paste, and fail at 200% scale. `Secure` carries an `Icon/eye` reveal, a **second 48 dp target** inside a row that is otherwise a text input. **Read-only is not built** — it is not the same as `Disabled` and gets added when a screen needs it |

| 9 | **Chip** | Archive's filter control · `Idle` / `Selected`. A **48 pt interactive target wrapping a 40 pt visible pill** — the visible pill stays compact, the target clears NFR-101. **Idle binds `outlineStrong`, never `outline`**: the border is the only thing identifying the control, and `outline` measures 1.65:1 dark / 1.32:1 light against WCAG 1.4.11's 3:1 (§1 already states this rule; the loose frames had never followed it). States differ by three cues — fill, border and label colour — so NFR-104 holds in greyscale |

| 10 | **FavouriteToggle** | the per-entry favourite mark in the Archive day view (FR-093) · `Idle` / `Marked`. A 48 pt row wrapping a 24 px glyph and a visible label, differing by **shape** (outline vs filled bookmark) and label text, never by colour — both states are `inkMuted`, so NFR-104 holds in greyscale. Carries a `CHANGE_TO` reaction in both directions, so the mark toggles in place with no navigation, which is what §6 of `states.md` specifies |

**Why ten exists. Added 2026-09-07.** The favourite mark was **8 loose frames** — two entries on
each of the four day-view screens. Every one of them was drawn at the correct 48 pt, placed
correctly, and **wired to nothing**; none carried the underline that §1 makes the house affordance,
so all eight read as captions rather than controls. It is the `Chip` failure exactly: a repeated
loose frame accumulates the same defect once per copy, and fixing them in place guarantees a next
time. Checked against §4's own test first — it is not a variant of `Chip` (a filter over a list, not
a mark on an item), of `PrimaryAction` (not one per screen), or of `Field` (not an input). The
deciding argument is that the control has a **second state**, and a loose frame cannot express one:
Figma models an in-place toggle as a variant swap, so the state the spec requires was literally
undrawable until this component existed.

**Why nine exists. Added 2026-09-05.** Archive's filter chips were **36 loose frames**, not a component, and they were all 40 pt tall. That is why the defect multiplied rather than staying fixed: an external review counted 18 undersized chips, and by the time it was actioned there were 24, because six more had been drawn by hand as Archive grew from 14 screens to 20. Raising them in place would have guaranteed a seventh recurrence. Checked against §4's own test first: `Chip` is not a variant of `Field` (not an input), of `PrimaryAction` (not one-per-screen, and it is a filter rather than a commitment), or of `DayCell` (not a calendar unit).

**Why seven and eight exist.** `InviteCode` carries a state that appears on exactly one screen but
must be unmistakable. `Field` was added on 2026-09-03 because onboarding is almost entirely input,
and `ComposeField` does not generalise: it is pinned to entry text, the 400-character counter and
media affordances. Neither is a variant of an existing component; both were checked against that
test first.

If a ninth feels necessary, check whether it is a variant of one of these first. Neither `Field` nor
`InviteCode` defines TEXT or BOOLEAN component properties. **`EntryCard` does** — `authorName` and
`entryText` — and is the only component in the file that does; the claim that none did was wrong and
was corrected on 2026-09-04. Everywhere else, per-variant content is documentation and instance text
is overridden directly.

---

## 5. Figma ↔ Compose binding

Figma Variables carry per-platform code syntax; Code Connect has a `Compose` component language.
Bind once and the token name is the same object in both places.

**Code-syntax platforms, set on every variable:**

| Platform | Emits | For |
|---|---|---|
| `ANDROID` | Jetpack Compose theme reference | The KMP client — `shared/designsystem` |
| `WEB` | CSS custom property | The marketing site |
| `iOS` | SwiftUI `Color` extension | **Not currently set on any variable.** Reserved for the ADR-0010 contingency where a screen is built natively; add it then, in one pass, rather than carrying an unused third syntax now |

**Collections:** `color` with two modes — `dark` (default) and `light`. `type`, `spacing` and
`radius` single-mode.

**Every variable emits a CSS custom property on `WEB`** — verified across all **41** on 2026-09-04,
with no exceptions. (The figure read 43 until then: it predated removing `accent` and `onAccent`.)
`label/tracking` was the last holdout: it emitted the literal `0.11em`, which hardcoded a value into
the marketing site instead of referencing a token. It now emits `var(--type-label-tracking)`, and
**the custom property must be defined as `0.11em`, not `1.43px`** — the stored Figma value is pixels
only because Figma forces bound letter-spacing into pixel units.

**The binding was silently lost and was restored on 2026-09-04.** An audit found the `label` style
holding a literal `PERCENT 11` with no `letterSpacing` binding at all, and the variable sitting
orphaned at the value `11` — which, had anyone re-bound it, Figma would have applied as **11 px**,
the 373-px-versus-181-px failure this section warns about. The variable is now `1.43` and bound, and
the rendered width is unchanged (measured: 193 px before and after, same string). This is the exact
drift the section predicted, so treat the binding as something to assert, not assume.

**Naming:** semantic, flat, matching the token names above exactly — `surface`, `ink`, `inkMuted`,
`outlineStrong`. Not `clay-500`, not `moyi-orange`, not `primary-container`. `19` §7.6 means the
name may still change; semantic naming makes a rename a values change, not a refactor.

**Direction of truth** (`14` §7.3): Figma is the source of truth for *values*;
`shared/designsystem` for *structure*. A Compose refactor never silently renames a variable.

**Do not let `figma-design-to-code` emit React.** Its default target is web. Steer it to Compose
against these tokens, or take the values only and write the composable by hand.

---

## 6. Iconography and logo

**`Icon/eye-off` is deliberately absent.** The reveal toggle's second state never appears on the
canvas, and the app imports Lucide SVGs directly, so drawing it here would add an unreviewed
approximation for no design decision. `Icon/eye` itself was transcribed with arc-to-cubic conversion
because Figma rejects SVG arc commands — verify both against the real SVGs at import.

**`Icon/bookmark-filled` is the one icon that carries a fill** (2026-09-04, FR-093). Every other glyph
in the set is stroke-only. It is Lucide `bookmark` with the same path given `NONZERO` winding and a
fill bound to `ink`, so the favourited and not-favourited states differ by **shape**, not colour, and
NFR-104 holds. Like `Icon/eye` it needed arc-to-cubic conversion — Figma's parser rejects both the `A`
and `V` commands, so the SVG's `V5` and its two corner arcs were rewritten as explicit lines and
cubics. Verify against the real SVG at import.

**Favourites pairings, measured 2026-09-04** (dark / light), all against a checker, none by eye:
`inkMuted` on `surface` — the favourite label, the empty-state body and the privacy line —
**9.98 / 6.29**; `ink` on `surface` (bookmark glyph) **16.26 / 15.18**; `ink` on `surfaceRaised`
(the DayCard indicator) **15.09 / 15.84**; `inkMuted` on `surfaceRaised` (the date beside it)
**9.26 / 6.56**; `surface` on `ink` (selected chip, text on fill) **16.26 / 15.18**. No new token was
introduced — the work reuses existing pairings, and the lowest of them clears body text's 4.5:1 by
a comfortable margin in both modes.

**Adopt a professionally-drawn icon set; do not draw one.** `14` §7.4 words this as "buy", which is
misleading — the principle is *don't draw your own*, not *spend money*. Free sets satisfy it fully.
One set, one weight, one metric. Mirror directional icons under RTL (`14` §5).

**Adopted: Lucide** (ISC licence, free for commercial use), lucide-static v1.40.0 — 24 px, 2 px
stroke, round cap and join, twelve icons imported (chevron-left, chevron-down, image, mic, calendar,
settings, x, copy, check, eye, bookmark, bookmark-filled). One consistent stroke weight,
geometric and quiet — it suits the editorial register better than Material Symbols, which would pull
the app toward stock-Android. **No dependency is required:** Lucide ships SVGs and Android Studio
converts SVG to vector drawable natively, so import only the handful actually used — back, disclose,
photo, mic, calendar, settings, close, copy, confirm.

The reason not to hand-draw is not craft snobbery: inconsistent optical weight across six hand-made
icons is a visible tell, and it is the exact thing `14` §7.4 is guarding against. Meaningful icons carry a content description; decorative ones are marked
decorative (NFR-101).

The logo is one asset behind one token and must work at 48 px (`19` §6). Never inline the wordmark
into a component.

**Orthography decided 2026-09-03 — marked for humans, ASCII for machines** (`19` §3c):
**`Mọyì`** for the logo, app name and marketing; `moyi` for website, handles, email and all code
identifiers; store subtitle **"Mọyì — daily appreciation for two"**.

**Verified in Newsreader Medium at 132 px and at the 48 px minimum `19` §6 requires:** `ọ` U+1ECD and
`ì` U+00EC render as real glyphs, and the marked form measures identically to the unmarked one in both
width and height — the diacritics sit inside the font's normal metrics, so no layout needs extra
leading. This is exactly the criterion that eliminated Instrument Serif and Libre Baskerville.

**This does not weaken the Newsreader glyph criterion.** The coverage of `ọ` U+1ECD, `ẹ` U+1EB9 and
combining dot-below and grave was never mainly for the wordmark — it is for **entry text**. A member
writing "ẹ ṣé" in their own entry is the case that matters, and it is the whole product. Instrument
Serif and Libre Baskerville stay eliminated.

**The composer toolbar lives inside the field.** One bordered box holds the entry text with the media
icons and the counter along its bottom edge — the pattern Claude and ChatGPT use — rather than a
separate row floating beneath the box. Text and icon glyphs are optically aligned at **20 pt from the
box edge**, achieved by wrapping the text in 12 pt of padding so it matches the 12 pt that a 48 pt
target contributes when centring a 24 pt glyph. **Do not pad one without the other** or they drift.

**Icon-only controls carry two obligations.** Every one needs a `contentDescription`, because nothing
visible names it — `ComposeField`'s media buttons are "Add a photo" and "Record a voice note". And
**icons do not scale with Dynamic Type**, so a reader at 200 % text gets the same 24 px glyph while
everything around it doubles. The 48 dp target has room for a label if testing shows that is a problem.

**Icon strokes bind to `ink`.** Override the stroke colour on the instance, never inside the vector.
The tappable target is the frame around the 24 px glyph — 48 dp Android, 44 pt iOS — never sized to
the glyph itself.

**No heart icon.** `01` §3.4 rules out the hearts-and-glitter default and `19` §6 rules out red —
a red heart breaks both at once, and the reveal does not need a symbol when it has the words.

---

## 7. What these tokens may not be used to build

- No gradients, anywhere.
- No glassmorphism or backdrop blur.
- No glow behind elements.
- No sparkles, badge bursts, or bounce on success.
- No confetti except at the four genuine milestones (7 / 30 / 100 / 365).
- No colour-only status anywhere on the streak surface.

---

## 7a. The wrapping-text trap (bit me three times)

Setting `layoutSizingHorizontal = 'FILL'` and `textAutoResize = 'HEIGHT'` **before** assigning
`characters` collapses a Figma text node to **width 0**. At the moment `FILL` is applied the node has
no content and no explicit width, so there is nothing to fill from.

**The order that works:** assign `characters` first, *then* `FILL`, *then* `HEIGHT`. To repair a node
that has already collapsed, set `textAutoResize = 'WIDTH_AND_HEIGHT'` first so it takes a natural
width, then `FILL`, then `HEIGHT`.

A related failure: clearing a fill override with `node.fills = []` writes an *empty override* rather
than restoring inheritance. To make an instance inherit again, recreate it.

**The keyboard is an OS surface and is deliberately NOT bound to our tokens.** It is drawn as a
simulation so the Compose layout can be judged against real occlusion, and its colours are iOS system
values, not `surface`/`ink`. That means **it does not follow the Color mode** — a light screen cloned
from a dark one keeps a dark keyboard until it is recoloured by hand. Frames are named
"keyboard (simulation · OS surface, not our tokens)" so no audit treats their unbound fills or
default-named keys as defects.

**The `StateBlock/line` zero-width node was repaired on 2026-09-07** using the recovery order
above, and the standing assertion now passes across every page. It had been a known, tolerated
failure since the section was written; a permanently-red check trains you to read red as normal.

**Audit for it by geometry, not by bindings.** The Phase 4 sweep passed a documentation frame whose
five paragraphs were all zero-width, because it checked variable bindings and text styles and never
asked whether a node was visible.

**The standing geometry audit — run it after every content edit, not only after a review.** Four
assertions, all cheap:

1. **No node wider than its parent's inner width.** Caught a resend line at 404 in 358 and a button
   label at 122 in 112, both created by swapping `characters` without re-checking sizing.
2. **No `TEXT` with characters at width 0**, and nothing with 40+ characters under 60 pt wide.
3. **No `VERTICAL` auto-layout whose children stack taller than it** unless
   `overflowDirection === 'VERTICAL'` declares the scroll. Caught `create bond · KEYBOARD UP`
   clipping at 490 in 472.
4. **Every screen frame exactly 844.**

Every one of these has fired on real defects. Binding audits do not catch any of them: a node can be
perfectly tokenised and still be off the edge of the screen.

**Under a keyboard, pin the header outside the scroll area.** The keyboard-up frames put `header` as
a direct child of the screen frame and let `content` scroll beneath it, because a back affordance
that scrolls away is a trap. The heading and eyebrow are omitted from those frames deliberately:
they have scrolled off, and the resting frame carries the full layout.

## 7b. What a text-contrast audit will not catch

Light mode found two defects that 301 passing contrast checks missed, because **contrast audits test
text, not shape**:

- `surfaceRaised` (`#FFFFFF`) on `surface` (`#FFF9F5`) is **1.04:1** in light mode. Any control whose
  identity depends on that fill difference *disappears* while its label still passes AA. `PrimaryAction`
  Disabled was invisible until it was given an `outline` hairline.
- The grain adds light, so it vanishes on light surfaces.

**Nor may a card be.** `EntryCard` now carries a hairline `outline` in every state. Without it, a
light-mode card was visible only because of the grain — and a card whose existence depends on a
texture is fragile. This is what §3 asked for anyway: hairline first, shadow only where something
genuinely floats.

**Rule: a control must never be identified by fill alone.** If a fill difference is the only thing
making something a control, it needs a border, and that border needs `outlineStrong` when it is
load-bearing.

## 8. Still open

1. ~~**Filled or outlined `PrimaryAction`.**~~ **Decided 2026-09-03: `ink` fill, Newsreader label,
   hugging, minimum width 176, height 48.** Chosen against five alternatives rendered on the real
   Compose screen.

   *Accent-filled was rejected as generic* — a terracotta pill with a tracked uppercase sans label is
   the default every generated design reaches for, and it spent the accent on the largest painted
   object on the screen. *Full-width* was rejected at 16,800 px² of fill. *Outlined*, and
   *raised-plus-hairline*, were rejected because a 1 px border is the cue that dies at low brightness,
   and `14` §1 says this app is used at night, in bed.

   **Why `ink`/`surface` rather than `accent`/`onAccent`:** it frees the accent to be small marks only
   (`19` §6), and the pair **inverts automatically by mode** — a warm-white pill on dark, a near-black
   pill on light — at **16.26:1 dark and 15.18:1 light**, the highest contrast of any option in both
   modes. `accent`/`onAccent` stays orange in both and cannot do this.

   **Implemented as HUG with `minWidth: 176`**, not a fixed 176. The minimum is a floor: a longer label grows the button rather than overflowing it. Fixing an instance at 176 reintroduces the clipping this prevents, which is how "Create an account" ended up overflowing on 2026-09-03.

   The label is **Newsreader at 16 — `body` size, serif face.** The scale is still four sizes; face is
   a separate axis. Do not "correct" this to the sans label style. The minimum width is not cosmetic:
   hug-to-content would resize the most important control on the screen for every locale.

2. ~~**`danger`.**~~ Derived 2026-09-03. See §1.
3. ~~**The six components.** Proposals, not decisions.~~ **Closed 2026-09-03: all eight are built,
   bound and audited.** `InviteCode` and `Field` took the set past the original ceiling of six; the
   reason for each is in §4.
4. **Radius 12.** Worth seeing 8 and 16 once real screens exist.
5. ~~**Card texture.**~~ **Decided 2026-09-03: grain ships**, on the three `surfaceRaised`
   `EntryCard` variants. **Not on `Tombstone`** — that one is recessed to `surface`, and its flatness
   is what makes it read as absence. Grain is a property of raised paper, not of the ground. A 256 px tileable RGBA grain
   Asset: 256 px tileable RGBA (linen-tinted speckle, fine sigma 22, mottle sigma 6) at 0.45 opacity,
   NORMAL blend. **The grain is dark-mode only.** It is a linen-tinted speckle that adds light, so on
   a white card in light mode it is invisible and the cards read flat. Figma has no image variable, so
   the texture cannot switch by mode the way a colour token does. Either accept light mode as
   untextured, or author a second dark-tinted grain and swap it at the platform layer. Untextured is
   the honest default until someone asks for it.

   **Resolved 2026-09-03: light mode gets its own grain.** A second 256 px tile tinted `rosewood/850`
   at 0.35 opacity — a darkening speckle, since paper fibre on a light ground reads as shadow, not
   light. Measured cost: ink on card 15.84 → **15.33 mean, 13.77 worst case**. Figma has no image
   variable, so the two assets cannot switch by mode inside a component — **the swap belongs at the
   platform layer** (a themed drawable). The Figma component carries the dark grain; the light board
   carries the light grain as an override, so both are visible for review. **`OVERLAY` does not work on this palette** — it compresses toward black on a ~1 %
   luminance ground and the texture vanishes; the grain must carry its own alpha and add light.
   Contrast cost measured: ink on card falls 15.09 → **14.60** mean, worst case 11.71 in the brightest
   1 % of pixels. Well clear of 4.5. Compose cost is one ~54 KB tiling asset. The deckled edge is still
   refused: a per-card irregular mask is expensive in Compose and breaks as the card grows at 200 %.
6. ~~**The promise copy.**~~ **Wording decided 2026-09-03, revised 2026-09-04: "Write before you read. Your day opens when
   you both have."** Silent on FR-063's midnight auto-unlock rather than wrong about it, and it is
   the canonical form for every surface — confirm screen, onboarding, marketing. Live on the Join
   screens. **Not closed:** `01` §1 still carries the absolute sentence and has not been amended.
   ADR-0005 already states the escape hatch correctly.
