# Scheduled nightly, in the worker (the only process allowed to write the store):
# rewrites the time-series log without overwritten values, and drops days older
# than two years. See server/docs/design/006.
class CompactSeries
  include WildQueue::Job

  KEEP_DAYS = 730

  def perform(today: nil)
    today = today ? Date.iso8601(today) : Date.current
    store = SeriesStore.writer
    return unless store.respond_to?(:compact) # the in-memory store has no files

    store.compact(drop_before: WildSeries::TimeBucket.day(today - KEEP_DAYS))
  end
end
