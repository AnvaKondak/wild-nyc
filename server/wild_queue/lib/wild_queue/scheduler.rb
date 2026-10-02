# frozen_string_literal: true

module WildQueue
  # Recurring jobs, without cron.
  #
  #   scheduler = WildQueue::Scheduler.new(queue)
  #   scheduler.every(6 * 3600, "refresh-cells", RefreshAllCells)
  #   scheduler.every(24 * 3600, "compact-series", CompactSeries)
  #
  # A worker calls `tick` on every loop. Time is cut into slots of `interval`
  # seconds since the epoch; the first tick in a new slot enqueues the job. The
  # backend's claim_slot makes sure that happens once per slot, however many
  # workers are ticking. See docs/design/009-scheduler-slots.md.
  class Scheduler
    Task = Data.define(:name, :interval, :job_class, :args)

    def initialize(queue, clock: -> { Time.now })
      @queue = queue
      @clock = clock
      @tasks = []
    end

    def every(interval, name, job_class, args = {})
      @tasks << Task.new(name: name.to_s, interval: Integer(interval), job_class: job_class, args: args)
      self
    end

    # Enqueues every task whose current slot hasn't been claimed yet.
    # Returns the names of the tasks it enqueued.
    def tick
      now = @clock.call
      @tasks.filter_map do |task|
        slot = now.to_i / task.interval
        next unless @queue.backend.claim_slot("#{task.name}:#{slot}")

        @queue.enqueue(task.job_class, task.args, unique_key: "scheduled:#{task.name}")
        task.name
      end
    end
  end
end
