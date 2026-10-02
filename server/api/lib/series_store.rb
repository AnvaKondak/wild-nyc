# Where the app gets its time-series store.
#
# - The worker process is the one writer: bin/worker sets SeriesStore.writer to a
#   writable WildSeries::DiskStore.
# - The API reads through SeriesStore.read, a shared read-only DiskStore that
#   catches up on the log before each use (see server/docs/design/005).
# - Tests set both to an in-memory WildSeries::Store.
module SeriesStore
  class << self
    attr_writer :writer, :reader

    def writer
      @writer or raise "no series writer: only the worker writes (bin/worker)"
    end

    # Yields the store, up to date. Serialized because a DiskStore isn't thread-safe
    # and Puma serves requests on several threads.
    def read
      lock.synchronize do
        store = (@reader ||= WildSeries::DiskStore.open(Rails.configuration.x.series_dir, writable: false))
        store.refresh if store.respond_to?(:refresh)
        yield store
      end
    end

    def reset!
      @writer = @reader = nil
    end

    private

    def lock
      @lock ||= Mutex.new
    end
  end
end
