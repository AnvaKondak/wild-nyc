# Wild Neighbors

An iOS app about the everyday animals on your block in NYC and Jersey City.
Tagline: "Meet the neighbors." Motto: "We notice. We don't follow."

Repo / portfolio name: Wild NYC.

## What the app is

People open it to feel in step with nature right now: what the sparrows, pigeons,
squirrels and crows near them are doing at this time of day and season. It is about
noticing, understanding and helping animals, never tracking them.

Full screen-by-screen spec: `docs/SPEC.md`. Visual mocks: `docs/mocks/` (see note below).

## Non-negotiable principles

- **Species and groups only.** Never track, name or follow individual animals.
- **No exact animal locations.** Work at neighborhood level (geohash precision 6,
  about 1.2 × 0.6 km). Never show a location finer than that, and keep any location
  iNaturalist already obscures obscured.
- **The user's exact location is never stored or sent.** Convert to a neighborhood
  cell on the phone.
- **Gentle, never guilt.** No streaks that break, no guilt notifications, no endless
  feeds, at most one notification a day.
- **Live updates up front, facts on the profile.** The home screen is short "what
  they're doing right now" moments. Long facts live on each species' profile page.
- **Animals are someone.** Copy uses "who," not "that." Warm, playful, never preachy.
  Voice is **funny + cute**: see `docs/VOICE.md`.
- No shared "people noticed" counts until the app has real users.

## Stack

- **App:** Expo (React Native) + TypeScript, iOS first.
- **API (later phase):** Rails in API-only mode.
- **Portfolio pieces (later phase):** a time-series store and a job queue written in
  plain Ruby from scratch. The owner must be able to explain these line by line, so
  build them in small, reviewable steps with tests and a short design note for each
  decision. Do not pull in a library that does the core job (no Sidekiq, no Redis
  queue gem, no time-series DB) for these two pieces.
- **App data (later phase):** Postgres.
- **Data sources (later phase):** iNaturalist API, eBird API 2.0.

## Build phases

1. **Words + art:** species cards, seasonal calendar, kindness list (content as JSON).
2. **App shell:** all screens working with content bundled in the app. No backend.
   "I noticed them" is stored on the phone only.
3. **Live data:** Rails API, job queue pulling iNaturalist + eBird, time-series store,
   neighborhood endpoint.
4. **Launch:** TestFlight, App Store.

Work one phase at a time. Do not start phase 3 until phase 2 is done and approved.

## Design

Riso-print zine look. Flat colors, bold outlines, slightly offset color shadows
(like a print that's a little off-register). No gradients, no glassy effects.

| Token | Value | Use |
| --- | --- | --- |
| paper | `#FAF7F2` | default background |
| ink | `#1A1A2E` | text, outlines, offset shadows |
| ink-soft | `#3B3A50` | body text |
| ink-muted | `#55546A` | captions, labels |
| pink | `#FF6B9A` | accent, kindness |
| pink-tint | `#FFE3EC` | tiles |
| blue | `#2F5BEA` | primary cards, buttons |
| blue-tint | `#DDE6FF` | tiles |
| yellow | `#FFD23F` | highlights, title shadow |
| yellow-tint | `#FFF4C7` | tiles |

- **Fonts:** Fraunces (display, headings, italic accents) and Instrument Sans (body, UI).
  Both on Google Fonts.
- **Titles:** Fraunces 600 with `text-shadow: 3px 3px 0 #FFD23F`; one word in italic pink
  or blue.
- **Cards:** radius 18–24, 1.5px ink border, solid offset shadow (4–5px, no blur) in pink,
  yellow or ink.
- **Animal art:** round "sticker" with a white 3–4px border, slight rotation (±3–8°),
  offset ink shadow. Use simple placeholder line icons until real illustrations exist.
- **Time of day theme:** dawn = pink-tint background, midday = yellow-tint,
  dusk = blue background with white text, night = ink background with paper text.
- **Touch targets:** at least 44px. Real buttons and links for accessibility.

### About the mocks

The files in `docs/mocks/` were made in a design tool. They use a custom runtime
(`support.js`, `<x-dc>`, `{{holes}}`, `<sc-for>`, a `DCLogic` class), so they will not
open in a browser on their own. Read them as a reference for layout, spacing, colors,
copy and interaction, then rebuild each screen properly in React Native. Do not copy the
runtime or that template syntax.
