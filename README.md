# Wild Neighbors

*Meet the neighbors.* An iOS app about the everyday animals on your block, starting with
NYC and Jersey City.

Brief and principles: [CLAUDE.md](CLAUDE.md). Screen spec: [docs/SPEC.md](docs/SPEC.md).

## Status

- Phases 1 (words + art) and 2 (app shell): done. Content is bundled; "I noticed them"
  and kindness checks are stored on the phone only.
- Phase 3 (live data): built, not switched on. A Rails API with a from-scratch job queue
  and time-series store fetches iNaturalist (and optionally eBird) counts per
  neighborhood. See [server/README.md](server/README.md). Release builds have no API
  address, so the launch app runs on its bundled content: a snapshot of five years of
  iNaturalist sightings per neighborhood and season (`scripts/build_sightings.py`).
- Phase 4 (launch): App Store submission in progress. Listing, screenshots and review notes:
  [docs/app-store/](docs/app-store/). Privacy policy and support page: `site/`, published
  to https://anvakondak.github.io/wild-nyc/.

## Run it

```sh
npm install
npx expo start --ios     # iOS simulator (Expo Go)
npx expo start --web     # browser
npm test                 # unit + content tests
npm run typecheck
```

Live data (optional): start the server (see `server/README.md`). In development the app
talks to `http://localhost:3000`; set `EXPO_PUBLIC_API_URL` to use another server.

Refresh the bundled sightings once or twice a year: `python3 scripts/build_sightings.py`.

In development builds, tap the time header on **Right now** to preview the dawn, midday,
dusk and night themes.

## Layout

```
src/app/          screens (expo-router): tabs, welcome, add-place, pick-favorites, species/[id],
                  hurt-animal, privacy
src/components/   Sticker, Title, Card, Button, pills, street and neighborhood scenes
src/content/      bundled JSON (species, stories, kindness, places, hurt-animal) + types
src/lib/          story builder, sightings, neighborhoods and search, time of day / season / moon
src/state/        on-device state (reducer, selectors, AsyncStorage provider)
src/theme/        design tokens and time-of-day themes
```

## Privacy

The app never asks for the phone's location: you pick your neighborhood from a list, and
everything works at that level. The only thing that leaves the phone is the
neighborhood's center, rounded to about a kilometer, sent to Open-Meteo for the weather.
Sun times are computed on the phone. Full policy: `src/content/privacy.json`.

## Later

- Turn on live data (`docs/DEPLOY.md`)
- A web version
- More species and more cities
