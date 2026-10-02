# frozen_string_literal: true

require "json"

module WildQueue
  # The front door for adding jobs.
  #
  #   queue = WildQueue::Queue.new(backend)
  #   queue.enqueue(FetchCell, cell: "dr5rke")
  #   queue.enqueue(FetchCell, { cell: "dr5rke" }, run_at: Time.now + 3600, unique_key: "fetch:dr5rke")
  class Queue
    attr_reader :backend

    def initialize(backend, clock: -> { Time.now })
      @backend = backend
      @clock = clock
    end

    # unique_key: if a job with the same key is already waiting or running, don't
    # add another; return the existing one. Keeps a scheduler from piling up
    # duplicate "refresh this cell" jobs when a fetch is slow.
    def enqueue(job_class, args = {}, run_at: nil, unique_key: nil, **kwargs)
      raise ArgumentError, "#{job_class} doesn't include WildQueue::Job" unless Job.registry[job_class.name] == job_class

      args = args.merge(kwargs)
      @backend.push(
        queue: job_class.queue_name,
        job_class: job_class.name,
        args: normalize(args),
        run_at: run_at || @clock.call,
        unique_key: unique_key
      )
    end

    private

    # Round-trip through JSON now, so a job sees exactly the same args whether it
    # ran from memory or from Postgres (string keys, no symbols, no Ruby objects).
    def normalize(args)
      JSON.parse(JSON.generate(args))
    end
  end
end
