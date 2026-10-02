# frozen_string_literal: true

module WildQueue
  # One stored job and where it is in its life:
  #
  #   ready ──claim──▶ running ──success──▶ done
  #     ▲                │
  #     └──fail (retry)──┤
  #                      └──fail (out of attempts)──▶ dead
  #
  # A running job whose lease runs out (its worker died) can be claimed again.
  Record = Data.define(
    :id,           # Integer, assigned by the backend
    :queue,        # String
    :job_class,    # String, e.g. "FetchCell"
    :args,         # Hash with String keys
    :state,        # "ready" | "running" | "done" | "dead"
    :attempts,     # Integer, how many times a worker has started it
    :run_at,       # Time, don't start before this
    :locked_by,    # String worker id, while running
    :locked_until, # Time, the lease: after this, another worker may take it
    :last_error,   # String, from the most recent failure
    :unique_key    # String or nil, see Queue#enqueue
  ) do
    def ready? = state == "ready"
    def running? = state == "running"
    def done? = state == "done"
    def dead? = state == "dead"
  end
end
