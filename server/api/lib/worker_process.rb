# Everything bin/worker sets up, kept here so it can be read (and tested) in one place.
#
# The worker process:
#   - is the single writer of the time-series store (it holds the store's lock);
#   - runs wild_queue jobs from the "fetch" and "default" queues;
#   - ticks the scheduler, which enqueues the recurring jobs below.
module WorkerProcess
  SCHEDULE = [
    [6 * 3600, "refresh-cells", "RefreshCells"],
    [24 * 3600, "compact-series", "CompactSeries"],
    [24 * 3600, "prune-jobs", "PruneJobs"],
  ].freeze

  def self.build(conn:, logger: Rails.logger)
    backend = WildQueue::Backends::Postgres.new(conn)
    scheduler = WildQueue::Scheduler.new(WildQueue::Queue.new(backend))
    SCHEDULE.each { |interval, name, job| scheduler.every(interval, name, job.constantize) }
    WildQueue::Worker.new(backend, queues: %w[fetch default], scheduler: scheduler, logger: logger)
  end

  def self.run
    Rails.application.eager_load! # job classes register themselves when loaded
    SeriesStore.writer = WildSeries::DiskStore.open(Rails.configuration.x.series_dir)

    worker = build(conn: ActiveRecord::Base.connection.raw_connection)
    %w[INT TERM].each { |signal| trap(signal) { worker.stop } } # finish the current job, then exit
    Rails.logger.info("[worker] #{worker.id} started; series in #{Rails.configuration.x.series_dir}")
    worker.run
  ensure
    SeriesStore.writer&.close if SeriesStore.instance_variable_get(:@writer)
  end
end
