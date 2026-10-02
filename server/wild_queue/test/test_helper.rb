require "minitest/autorun"
require "wild_queue"

# A clock the tests can move by hand.
class FakeClock
  attr_accessor :now

  def initialize(now = Time.utc(2026, 10, 1, 12))
    @now = now
  end

  def advance(seconds)
    @now += seconds
  end

  def call = @now
end
