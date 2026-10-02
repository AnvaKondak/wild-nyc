require "test_helper"
require "tmpdir"

class ScheduledJobsTest < ActiveSupport::TestCase
  def backend = WildQueue::Backends::Postgres.new(ActiveRecord::Base.connection.raw_connection)

  test "refresh queues one fetch per recently requested cell" do
    Cell.touch_requested!("dr5rke", now: 1.day.ago)
    Cell.touch_requested!("dr5rkw", now: 2.days.ago)
    Cell.touch_requested!("dr5rmn", now: 90.days.ago) # nobody's looked in months

    RefreshCells.new.perform
    RefreshCells.new.perform # again before the fetches ran: no duplicates

    queued = ActiveRecord::Base.connection.select_values("SELECT unique_key FROM wild_queue_jobs ORDER BY unique_key")
    assert_equal %w[inat:dr5rke inat:dr5rkw], queued
  end

  test "compaction keeps two years and survives a restart" do
    Dir.mktmpdir do |dir|
      store = WildSeries::DiskStore.open(dir)
      SeriesStore.writer = store
      tags = { cell: "dr5rke", species: "rock-pigeon", source: "inat" }
      store.write(tags, WildSeries::TimeBucket.day("2023-06-01"), 5) # older than 2 years
      store.write(tags, WildSeries::TimeBucket.day("2026-09-01"), 2)
      store.write(tags, WildSeries::TimeBucket.day("2026-09-01"), 3)

      CompactSeries.new.perform(today: "2026-10-01")
      store.close

      reopened = WildSeries::DiskStore.open(dir)
      assert_equal [3], reopened.range(tags).map(&:value)
      reopened.close
    end
  end

  test "prune deletes old finished jobs and keeps dead ones" do
    b = backend
    old = b.push(queue: "default", job_class: "RefreshCells", args: {}, run_at: 30.days.ago, unique_key: nil)
    b.complete(old.id)
    dead = b.push(queue: "default", job_class: "RefreshCells", args: {}, run_at: 30.days.ago, unique_key: nil)
    b.bury(dead.id, error: "boom")

    PruneJobs.new.perform
    assert_nil b.find(old.id)
    assert b.find(dead.id)
  end

  test "the worker's schedule names real job classes" do
    WorkerProcess::SCHEDULE.each do |_, _, job|
      klass = job.constantize # loading the class is what registers it
      assert_equal klass, WildQueue::Job.registry[job]
    end
  end

  test "a worker runs a queued fetch end to end" do
    FetchInatCell.client = InatClient.new(http: FakeHttp.new([200, Rails.root.join("test/fixtures/files/inat_dr5rke.json").read]), throttle: NO_WAIT)
    Cell.touch_requested!("dr5rke")
    JobQueue.fetch_cell("dr5rke")

    worker = WorkerProcess.build(conn: ActiveRecord::Base.connection.raw_connection, logger: nil)
    assert_equal 1, worker.work_off
    assert Cell.find("dr5rke").fetched?
    assert_equal 2, @series.range({ cell: "dr5rke", species: "rock-pigeon", source: "inat" }).sum(&:value)
  ensure
    FetchInatCell.client = nil
  end
end
