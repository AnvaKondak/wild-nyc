# App Store privacy answers

What to enter in App Store Connect → App Privacy. Keep this in step with
`src/content/privacy.json` (the in-app policy) and `docs/PRIVACY.md`.

**Data collection: yes, one type.**

| Data type | Collected? | Linked to the user? | Used for tracking? | Purpose |
| --- | --- | --- | --- | --- |
| Coarse Location | Yes | No | No | App Functionality |

Why "coarse location" at all: the app sends the center of the neighborhood cell, rounded
to two decimals (about 1 km), to Open-Meteo for the weather. Apple counts location that
leaves the device, even this coarse and unlinked. (The launch build has no server; if
the optional live-data API in `server/` is ever turned on, it also receives the cell.)

Everything else: **not collected.** No contact info, identifiers, usage data,
diagnostics, purchases or user content. Saved neighborhoods, settings and the sightings
cache stay on the device. Notifications are local (no push token).

If the optional API is ever deployed: it doesn't log client IPs
(`server/api/config/initializers/no_ip_logging.rb`), and the policy needs its section back.

Privacy policy URL: host `docs/PRIVACY.md` (for example on GitHub Pages) and enter that
URL. Set `contact` in `src/content/privacy.json` first, then run
`python3 scripts/build_privacy.py`.
