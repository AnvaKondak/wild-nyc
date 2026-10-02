# frozen_string_literal: true

module WildQueue
  module Backends
    # Keeps jobs in a Hash. For tests and for running everything in one process.
    #
    # Every backend answers the same five calls; Queue and Worker only use these:
    #   push(attrs)                         -> Record
    #   claim(queues:, worker:, now:, lease:) -> Record or nil
    #   complete(id)
    #   retry_later(id, error:, run_at:)
    #   bury(id, error:)
    # plus find(id) and counts for inspecting.
    #
    # A Mutex makes each call atomic, so several worker threads can share one.
    class Memory
      def initialize
        @jobs = {}
        @next_id = 1
        @lock = Mutex.new
      end

      def push(attrs)
        @lock.synchronize do
          if attrs[:unique_key] && (existing = pending_with_key(attrs[:unique_key]))
            return existing
          end

          record = Record.new(id: @next_id, state: "ready", attempts: 0, locked_by: nil,
                              locked_until: nil, last_error: nil, **attrs)
          @next_id += 1
          @jobs[record.id] = record
        end
      end

      # Takes the next job that's due: the oldest run_at first, then the lowest id.
      # A running job whose lease has expired counts as due.
      def claim(queues:, worker:, now:, lease:)
        @lock.synchronize do
          job = @jobs.each_value
                     .select { |j| queues.include?(j.queue) && claimable?(j, now) }
                     .min_by { |j| [j.run_at, j.id] }
          return nil unless job

          @jobs[job.id] = job.with(state: "running", attempts: job.attempts + 1,
                                   locked_by: worker, locked_until: now + lease)
        end
      end

      def complete(id)
        update(id, state: "done", locked_by: nil, locked_until: nil)
      end

      def retry_later(id, error:, run_at:)
        update(id, state: "ready", run_at: run_at, last_error: error, locked_by: nil, locked_until: nil)
      end

      def bury(id, error:)
        update(id, state: "dead", last_error: error, locked_by: nil, locked_until: nil)
      end

      def find(id)
        @lock.synchronize { @jobs[id] }
      end

      def counts
        @lock.synchronize { @jobs.each_value.map(&:state).tally }
      end

      private

      def claimable?(job, now)
        (job.ready? && job.run_at <= now) || (job.running? && job.locked_until <= now)
      end

      def pending_with_key(key)
        @jobs.each_value.find { |j| j.unique_key == key && (j.ready? || j.running?) }
      end

      def update(id, **changes)
        @lock.synchronize { @jobs[id] = @jobs.fetch(id).with(**changes) }
      end
    end
  end
end
