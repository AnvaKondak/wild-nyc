# frozen_string_literal: true

# A small job queue, written from scratch.
# Start reading at Queue (adding jobs) and Worker (running them).
module WildQueue
end

require "socket"
require_relative "wild_queue/job"
require_relative "wild_queue/record"
require_relative "wild_queue/retry_policy"
require_relative "wild_queue/backends/memory"
require_relative "wild_queue/queue"
require_relative "wild_queue/worker"
