# 016 · The app uses live data gently, and works without it

**Request.** `src/lib/live.ts` calls `GET /v1/neighborhoods/:cell` with the current
neighborhood's geohash-6 cell, no cookies, no identifiers. Anything that isn't a
6-character cell is never sent. The API address comes from `EXPO_PUBLIC_API_URL`
(defaults to `http://localhost:3000` in development; off in a release build without it).

**Offline first.** `LiveDataProvider` shows the cell's last report from the phone's
cache straight away, asks the API at most hourly, and while a new cell is `warming_up`
asks again every 20 seconds a few times. If the API can't be reached, screens get no
live data and behave exactly as in phase 2, using the bundled content.

**Where it shows, and how.**
| Screen | Change |
| --- | --- |
| Right now | Scene slides about species seen nearby in the last 30 days come first; chapters stay last |
| Places | Each street spot goes to the species seen nearby most lately |
| Welcome | "N neighbors share your street" counts species actually seen around here this year |
| Places card, profile, Neighbors | "Seen nearby this week / this month", "Last seen nearby in May" |

**Words, not numbers.** The cards never show sighting counts. CLAUDE.md rules out
"people noticed" counts until the app has real users; iNaturalist counts are a
different thing, but numbers invite comparison and pressure, and "Seen nearby this
week" carries what matters. The source is credited on the Places card.

**Checked live:** with the API and worker running, Places for Park Slope picked Moths
(52 sightings in 30 days, lots of local moth-ers) and labeled Blue Jays "Seen nearby
this week".
