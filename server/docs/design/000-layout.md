# 000 · Layout: two plain gems and a Rails app

**Decision.** The time-series store (`wild_series`) and the job queue (`wild_queue`) are
standalone Ruby gems in this repo, with no Rails dependency. The Rails app (`api/`) uses
them as path gems.

**Why.**
- CLAUDE.md asks that both be explainable line by line. A gem with its own small test
  suite can be read, run and explained on its own, without Rails magic around it.
- Keeping Rails out means the core logic can't quietly lean on ActiveRecord or
  ActiveJob, which would blur what was written from scratch.

**Trade-off.** A little glue code in `api/` to connect them, instead of Rails defaults
like ActiveJob adapters. That glue is small and is where the boundaries are visible.

**Tests.** Minitest (ships with Ruby), so the gems have no test-framework dependency.
