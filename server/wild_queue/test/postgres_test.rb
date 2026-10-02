require "test_helper"
require_relative "support/jobs"
require_relative "queue_test"
require "wild_queue/backends/postgres"

# Needs a local Postgres with a wild_queue_test database (createdb wild_queue_test).
# Set WILD_QUEUE_PG="dbname=... host=..." to point elsewhere.
module PostgresSetup
  CONNINFO = ENV.fetch("WILD_QUEUE_PG", "dbname=wild_queue_test")

  def self.connect
    PG.connect(CONNINFO)
  end

  def self.reset!
    conn = connect
    conn.exec("SET client_min_messages TO warning")
    conn.exec("DROP TABLE IF EXISTS wild_queue_jobs, wild_queue_slots")
    WildQueue::Backends::Postgres.create_tables!(conn)
    conn.close
  end
end

class PostgresQueueTest < Minitest::Test
  include QueueBehavior

  def build_backend
    PostgresSetup.reset!
    @conn = PostgresSetup.connect
    WildQueue::Backends::Postgres.new(@conn)
  end

  def teardown
    @conn&.close
  end
end

class PostgresConcurrencyTest < Minitest::Test
  # Records which job ids ran, from many threads.
  class CountingJob
    include WildQueue::Job

    LOCK = Mutex.new
    class << self
      attr_accessor :ran
    end
    self.ran = []

    def perform(n:)
      LOCK.synchronize { self.class.ran << n }
    end
  end

  def setup
    PostgresSetup.reset!
    CountingJob.ran = []
  end

  def test_concurrent_claims_never_return_the_same_job
    conn = PostgresSetup.connect
    queue = WildQueue::Queue.new(WildQueue::Backends::Postgres.new(conn))
    20.times { |i| queue.enqueue(CountingJob, n: i) }
    conn.close

    now = Time.now
    claimed = Array.new(10) do |t|
      Thread.new do
        c = PostgresSetup.connect
        backend = WildQueue::Backends::Postgres.new(c)
        ids = []
        while (job = backend.claim(queues: ["default"], worker: "t#{t}", now: now, lease: 60))
          ids << job.id
        end
        c.close
        ids
      end
    end.flat_map(&:value)

    assert_equal 20, claimed.size
    assert_equal claimed.uniq.size, claimed.size, "a job was claimed twice"
  end

  def test_many_workers_run_every_job_exactly_once
    conn = PostgresSetup.connect
    queue = WildQueue::Queue.new(WildQueue::Backends::Postgres.new(conn))
    200.times { |i| queue.enqueue(CountingJob, n: i) }

    Array.new(8) do
      Thread.new do
        c = PostgresSetup.connect
        WildQueue::Worker.new(WildQueue::Backends::Postgres.new(c)).work_off
        c.close
      end
    end.each(&:join)

    assert_equal (0...200).to_a, CountingJob.ran.sort
    assert_equal({ "done" => 200 }, WildQueue::Backends::Postgres.new(conn).counts)
    conn.close
  end

  def test_unique_key_holds_under_concurrent_enqueues
    ids = Array.new(10) do
      Thread.new do
        c = PostgresSetup.connect
        job = WildQueue::Queue.new(WildQueue::Backends::Postgres.new(c)).enqueue(CountingJob, { n: 1 }, unique_key: "same")
        c.close
        job.id
      end
    end.map(&:value)

    assert_equal 1, ids.uniq.size
  end
end
