# frozen_string_literal: true

module WildQueue
  # How long to wait before trying a failed job again.
  #
  # Exponential backoff: 30s, 1m, 2m, 4m, 8m, ... capped at 1 hour, plus up to 10%
  # random jitter. The jitter spreads out retries so that, say, 50 jobs that all
  # failed during an iNaturalist outage don't all hit it again in the same second.
  # See docs/design/008-retries-and-dead-jobs.md.
  class RetryPolicy
    def initialize(base: 30, cap: 3600, jitter: 0.1, random: Random.new)
      @base = base
      @cap = cap
      @jitter = jitter
      @random = random
    end

    # attempts: how many times the job has run so far (1 after the first failure).
    def delay(attempts)
      backoff = [@base * (2**(attempts - 1)), @cap].min
      backoff + (@random.rand * backoff * @jitter)
    end
  end
end
