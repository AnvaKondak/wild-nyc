# 011 · The Rails app: thin, Postgres for app data, no ActiveJob

**Decision.** `api/` is a Rails 8.1 API-only app. It owns:
- `species`: synced from the app's `src/content/species.json` (`bin/rails species:sync`),
  now carrying each species' iNaturalist taxon id and eBird code. One source of truth:
  the app's content file.
- `cells`: geohash-6 cells someone has asked about, with when they were last asked
  about and last fetched. That's all: no user, device or IP column exists to fill.
- `wild_queue_jobs` / `wild_queue_slots`: created from the queue gem's own `SCHEMA`.

**Not used:** ActiveJob (its railtie isn't even loaded; jobs are `WildQueue::Job`s),
Solid Queue, Action Cable, mailers, Active Storage.

**Taxa, checked at the source.** The ids were looked up from the iNaturalist taxa API
and the eBird taxonomy, not typed from memory. That lookup found that NYC's gulls are
now *American* Herring Gull (*Larus smithsonianus*, iNat 1578489, eBird `amhgul1`)
after a taxonomy split; the app content was corrected. "Moths" is a group: count
Lepidoptera (47157) minus butterflies (Papilionoidea, 47224).

**Privacy in logs.** Request paths contain the cell. Rails' default request log line
includes the client IP, which would pair a person with their neighborhood. An
initializer (`no_ip_in_logs.rb`) drops the IP from that line, and a test checks it.

**Gems install into `api/vendor/bundle`.** Homebrew's Ruby keeps a RubyGems plugin
file as a read-only symlink into its Cellar, which breaks global installs of some
gems. A project-local bundle path sidesteps it and is git-ignored.
