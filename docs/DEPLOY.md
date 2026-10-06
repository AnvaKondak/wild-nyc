# Deploying live data

The app works on its own, but live sightings ("Seen nearby this week", the neighbors
seen lately leading the story) come from the Wild Neighbors API in `server/api`. It
runs on [Fly.io](https://fly.io): one small machine in Newark (next to NYC and Jersey
City), a managed Postgres database, and a persistent volume for the time-series store.

Why one machine: the time-series store is files on disk with a single writer. The worker
(which fetches iNaturalist and eBird on a schedule) is that writer, and the web server
reads the same files, so both run together (`server/api/bin/start`).

## One-time setup

From the repo root:

```sh
brew install flyctl
fly auth login

fly launch --no-deploy --copy-config --name wild-neighbors-api --region ewr
fly postgres create --name wild-neighbors-db --region ewr --initial-cluster-size 1 --vm-size shared-cpu-1x --volume-size 1
fly postgres attach wild-neighbors-db --app wild-neighbors-api     # sets DATABASE_URL
fly volumes create series --app wild-neighbors-api --region ewr --size 1

fly secrets set --app wild-neighbors-api \
  SECRET_KEY_BASE="$(cd server/api && bin/rails secret)" \
  EBIRD_API_KEY="<your eBird key, from server/api/.env>"
```

## Deploy

```sh
fly deploy            # builds server/Dockerfile from the repo root, runs bin/start
curl https://wild-neighbors-api.fly.dev/up
curl https://wild-neighbors-api.fly.dev/v1/neighborhoods/dr5rke
```

The first request for a neighborhood returns `"status": "warming_up"` while the worker
fetches it; the app retries on its own.

## Point the app at it

Release builds read the API address from `EXPO_PUBLIC_API_URL`, set in `eas.json` for
the `preview` and `production` profiles (`https://wild-neighbors-api.fly.dev`). If you
pick a different app name, change it there. Without an address, a release build simply
runs on its bundled content.

## Later

- New species in the app: redeploy; `bin/start` re-syncs `src/content/species.json`.
- Logs: `fly logs --app wild-neighbors-api`. The API doesn't log client IP addresses
  (`config/initializers/no_ip_logging.rb`).
- Rough cost: the smallest shared machine, a small Postgres and a 1 GB volume are a few
  dollars a month.
