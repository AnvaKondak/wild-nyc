require "test_helper"
require_relative "support/jobs"

# Backend-agnostic behavior. Postgres runs the same tests (see postgres_test.rb).
module QueueBehavior
  def setup
    @clock = FakeClock.new
    @backend = build_backend
    @queue = WildQueue::Queue.new(@backend, clock: @clock)
    @worker = WildQueue::Worker.new(@backend, queues: %w[default fetch], clock: @clock,
                                              retry_policy: WildQueue::RetryPolicy.new(jitter: 0))
    RecordingJob.calls = []
  end

  def test_enqueue_and_run
    job = @queue.enqueue(RecordingJob, cell: "dr5rke", days: 30)
    assert_equal "ready", job.state
    assert_equal 1, @worker.work_off
    assert_equal [{ cell: "dr5rke", days: 30 }], RecordingJob.calls
    assert @backend.find(job.id).done?
  end

  def test_args_come_back_the_same_as_after_json
    @queue.enqueue(RecordingJob, { "when" => :today, list: [1, { a: 2 }] })
    @worker.work_off
    assert_equal [{ when: "today", list: [1, { "a" => 2 }] }], RecordingJob.calls
  end

  def test_runs_jobs_in_order
    3.times { |i| @queue.enqueue(RecordingJob, n: i) }
    @worker.work_off
    assert_equal [0, 1, 2], RecordingJob.calls.map { |c| c[:n] }
  end

  def test_only_takes_jobs_from_its_queues
    other = WildQueue::Worker.new(@backend, queues: ["other"], clock: @clock)
    @queue.enqueue(FetchQueueJob)
    assert_equal 0, other.work_off
    assert_equal 1, @worker.work_off
  end

  def test_scheduled_jobs_wait_until_run_at
    @queue.enqueue(RecordingJob, { n: 1 }, run_at: @clock.now + 3600)
    assert_equal 0, @worker.work_off
    @clock.advance(3600)
    assert_equal 1, @worker.work_off
  end

  def test_failed_job_is_retried_with_backoff
    FlakyJob.failures_left = 2
    job = @queue.enqueue(FlakyJob)

    assert_equal 1, @worker.work_off # fails, retry in 30s
    record = @backend.find(job.id)
    assert record.ready?
    assert_equal 1, record.attempts
    assert_equal "RuntimeError: flaky", record.last_error
    assert_equal 0, @worker.work_off, "not due yet"

    @clock.advance(30)
    @worker.work_off # fails again, retry in 60s
    @clock.advance(59)
    assert_equal 0, @worker.work_off
    @clock.advance(1)
    @worker.work_off # succeeds
    assert @backend.find(job.id).done?
    assert_equal 3, @backend.find(job.id).attempts
  end

  def test_job_is_buried_after_max_attempts
    job = @queue.enqueue(AlwaysFailsJob)
    @worker.work_off
    @clock.advance(30)
    @worker.work_off
    record = @backend.find(job.id)
    assert record.dead?
    assert_equal 2, record.attempts
    assert_equal "ArgumentError: nope", record.last_error
  end

  def test_a_crashed_workers_job_comes_back_after_the_lease
    job = @queue.enqueue(RecordingJob, n: 1)
    crashed = @backend.claim(queues: ["default"], worker: "w-crashed", now: @clock.now, lease: 300)
    assert_equal job.id, crashed.id
    assert_equal 0, @worker.work_off, "still leased to the crashed worker"

    @clock.advance(300)
    assert_equal 1, @worker.work_off
    assert @backend.find(job.id).done?
    assert_equal 2, @backend.find(job.id).attempts
  end

  def test_unique_key_skips_duplicates_while_pending
    a = @queue.enqueue(RecordingJob, { n: 1 }, unique_key: "fetch:dr5rke")
    b = @queue.enqueue(RecordingJob, { n: 2 }, unique_key: "fetch:dr5rke")
    assert_equal a.id, b.id
    @worker.work_off
    assert_equal [1], RecordingJob.calls.map { |c| c[:n] }

    c = @queue.enqueue(RecordingJob, { n: 3 }, unique_key: "fetch:dr5rke") # first one is done
    refute_equal a.id, c.id
  end

  def test_refuses_classes_that_are_not_jobs
    assert_raises(ArgumentError) { @queue.enqueue(NotAJob) }
  end

  def test_unknown_job_class_in_storage_is_buried_not_run
    job = @backend.push(queue: "default", job_class: "Kernel", args: {}, run_at: @clock.now, unique_key: nil)
    @worker.work_off
    assert @backend.find(job.id).dead?
    assert_match(/UnknownJob/, @backend.find(job.id).last_error)
  end
end

class MemoryQueueTest < Minitest::Test
  include QueueBehavior

  def build_backend = WildQueue::Backends::Memory.new
end

class RetryPolicyTest < Minitest::Test
  def test_doubles_up_to_the_cap
    policy = WildQueue::RetryPolicy.new(jitter: 0)
    assert_equal [30, 60, 120, 240], (1..4).map { |n| policy.delay(n) }
    assert_equal 3600, policy.delay(20)
  end

  def test_jitter_adds_at_most_ten_percent
    policy = WildQueue::RetryPolicy.new(random: Random.new(1))
    delays = Array.new(50) { policy.delay(1) }
    assert delays.all? { |d| d >= 30 && d <= 33 }
    assert_operator delays.uniq.size, :>, 1
  end
end
