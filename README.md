# Wild Neighbors

*Meet the neighbors.* An iOS app about the everyday animals on your block in NYC and
Jersey City. We notice. We don't follow.

Brief and principles: [CLAUDE.md](CLAUDE.md). Screen spec: [docs/SPEC.md](docs/SPEC.md).

## Status

- Phases 1 (words + art) and 2 (app shell): done. Content is bundled; "I noticed them"
  and kindness checks are stored on the phone only.
- Phase 3 (live data): done. A Rails API with a from-scratch job queue and time-series
  store fetches iNaturalist (and optionally eBird) counts per neighborhood. See
  [server/README.md](server/README.md). The app uses them when it can reach the API
  and falls back to bundled content when it can't.

## Run it

```sh
npm install
npx expo start --ios     # iOS simulator (Expo Go)
npx expo start --web     # browser
npm test                 # unit + content tests
npm run typecheck
```

Live data: start the server (see `server/README.md`). In development the app talks to
`http://localhost:3000`; set `EXPO_PUBLIC_API_URL` to use another server.

In development builds, tap the time header on **Right now** to preview the dawn, midday,
dusk and night themes.

## Layout

```
src/app/          screens (expo-router): tabs, welcome, species/[id], add-place, hurt-animal
src/components/   Sticker, Title, Card, Button, pills, street and neighborhood scenes
src/content/      bundled JSON (species, stories, kindness, places, hurt-animal) + types
src/lib/          geohash, time of day / season / moon, story builder, location
src/state/        on-device state (reducer, selectors, AsyncStorage provider)
src/theme/        design tokens and time-of-day themes
```

## Privacy

The phone's position is turned into a geohash-6 cell (about 1.2 × 0.6 km) inside
`src/lib/locate.ts` and the coordinates are discarded. Only the cell is stored. Sun times
are computed from the cell's center. The only thing ever sent is that cell, to the
Wild Neighbors API, which stores nothing about who asked.

## Still to do before launch

- Hurt-animal copy and rehab phone numbers (`src/content/hurt-animal.json`, placeholders)
- Real illustrations to replace the placeholder line icons
- Content review by someone who knows NYC wildlife
