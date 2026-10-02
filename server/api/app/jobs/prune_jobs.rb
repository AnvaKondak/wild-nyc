# Scheduled daily: deletes finished jobs older than two weeks. Dead jobs are kept
# until someone looks at them.
class PruneJobs
  include WildQueue::Job

  KEEP = 14.days

  def perform
    WildQueue::Backends::Postgres.new(ActiveRecord::Base.connection.raw_connection).prune(before: KEEP.ago)
  end
end
