# Spaces out calls to an API: at most one call per `interval` seconds, per process.
# iNaturalist asks for no more than about one request a second.
class Throttle
  def initialize(interval, clock: -> { Process.clock_gettime(Process::CLOCK_MONOTONIC) }, sleeper: ->(s) { sleep(s) })
    @interval = interval
    @clock = clock
    @sleeper = sleeper
    @last = nil
    @lock = Mutex.new
  end

  def call
    @lock.synchronize do
      if @last
        wait = @interval - (@clock.call - @last)
        @sleeper.call(wait) if wait.positive?
      end
      @last = @clock.call
    end
    yield
  end
end
