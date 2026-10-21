# Wild Neighbors

*Meet the neighbors.* An iOS app about the everyday animals on your block, starting with
NYC and Jersey City.

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

## Upcoming Changes

- Turn on live data (docs/DEPLOY.md)
- A web version
- More species and more cities
