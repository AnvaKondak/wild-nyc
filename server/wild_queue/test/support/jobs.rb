# Jobs used by the tests. Each records what happened in a class-level list.

class RecordingJob
  include WildQueue::Job
  queue_name "default"

  class << self
    attr_accessor :calls
  end
  self.calls = []

  def perform(**args)
    self.class.calls << args
  end
end

class FlakyJob
  include WildQueue::Job
  max_attempts 3

  class << self
    attr_accessor :failures_left
  end
  self.failures_left = 0

  def perform(**)
    if self.class.failures_left.positive?
      self.class.failures_left -= 1
      raise "flaky"
    end
  end
end

class AlwaysFailsJob
  include WildQueue::Job
  max_attempts 2

  def perform(**) = raise(ArgumentError, "nope")
end

class FetchQueueJob
  include WildQueue::Job
  queue_name "fetch"

  def perform(**) = nil
end

class NotAJob
  def perform(**) = nil
end
