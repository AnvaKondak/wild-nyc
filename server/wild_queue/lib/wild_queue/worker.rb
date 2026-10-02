# frozen_string_literal: true

require "securerandom"

module WildQueue
  # Takes jobs from the backend and runs them, one at a time.
  #
  #   worker = WildQueue::Worker.new(backend, queues: %w[fetch default])
  #   worker.run          # loop until #stop (e.g. from a signal handler)
  #   worker.work_off     # run everything that's due now, then return (tests, scripts)
  class Worker
    attr_reader :id

    # lease: how long a claimed job is ours. If we die, another worker can take
    # the job after this. Must be longer than the slowest job.
    def initialize(backend, queues: ["default"], lease: 300, poll_interval: 1.0,
                   clock: -> { Time.now }, logger: nil, retry_policy: RetryPolicy.new)
      @backend = backend
      @queues = Array(queues).map(&:to_s)
      @lease = lease
      @poll_interval = poll_interval
      @clock = clock
      @logger = logger
      @retry_policy = retry_policy
      @id = "#{Socket.gethostname rescue 'host'}:#{Process.pid}:#{SecureRandom.hex(3)}"
      @stopping = false
    end

    def run
      until @stopping
        worked = work_one
        sleep(@poll_interval) unless worked || @stopping
      end
    end

    def stop
      @stopping = true
    end

    # Runs due jobs until none are left (or `limit` have run). Returns how many ran.
    def work_off(limit: Float::INFINITY)
      count = 0
      count += 1 while count < limit && work_one
      count
    end

    # Claims and runs one job. Returns false if nothing was due.
    def work_one
      record = @backend.claim(queues: @queues, worker: @id, now: @clock.call, lease: @lease)
      return false unless record

      perform(record)
      true
    end

    private

    def perform(record)
      job_class = Job.lookup(record.job_class)
      job_class.new.perform(**record.args.transform_keys(&:to_sym))
      @backend.complete(record.id)
      log "done #{describe(record)}"
    rescue StandardError => e
      handle_failure(record, job_class, e)
    end

    def handle_failure(record, job_class, error)
      message = "#{error.class}: #{error.message}"
      max = job_class ? job_class.max_attempts : 1 # unknown class: no point retrying

      if record.attempts >= max
        @backend.bury(record.id, error: message)
        log "dead #{describe(record)} after #{record.attempts} attempts: #{message}"
      else
        run_at = @clock.call + @retry_policy.delay(record.attempts)
        @backend.retry_later(record.id, error: message, run_at: run_at)
        log "retry #{describe(record)} at #{run_at}: #{message}"
      end
    end

    def describe(record) = "##{record.id} #{record.job_class}"

    def log(message)
      @logger&.info("[wild_queue #{@id}] #{message}")
    end
  end
end
