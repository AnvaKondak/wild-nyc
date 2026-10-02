# frozen_string_literal: true

require "forwardable"

module WildSeries
  # A Store that survives restarts: every write goes to the log on disk first,
  # then into memory. Opening it replays the log to rebuild memory.
  #
  #   writer = WildSeries::DiskStore.open("data/series")               # the worker
  #   reader = WildSeries::DiskStore.open("data/series", writable: false) # the API
  #   reader.refresh # pick up anything the writer added since the last look
  class DiskStore
    extend Forwardable

    # Reads are answered from memory, exactly like the in-memory Store.
    def_delegators :@memory, :range, :keys, :rollup, :group, :series_count, :point_count

    def self.open(dir, writable: true, **log_options)
      new(Log.new(dir, writable: writable, **log_options))
    end

    def initialize(log)
      @log = log
      @memory = Store.new
      refresh
    end

    # Write-ahead: the log line is on disk before memory changes, so a crash can
    # never leave memory holding something the disk doesn't.
    def write(tags, time, value)
      raise ArgumentError, "value must be a number" unless value.is_a?(Numeric)

      key = SeriesKey.new(tags) # validates the tags before anything is written
      @log.append(key, time, value)
      @memory.write(key.tags, time, value)
    end

    # Applies records added to the log since the last refresh. If the files were
    # compacted in the meantime, rebuilds memory from scratch.
    def refresh
      if @log.segments_replaced?
        @memory = Store.new
        @log.reset
      end
      @log.read_new { |r| @memory.write(SeriesKey.parse(r.key).tags, r.time, r.value) }
      self
    end

    # Rewrites the log as one segment holding only the current state: every
    # overwritten value and every dropped point disappears from disk.
    # With drop_before:, applies retention first (removes points older than it).
    def compact(drop_before: nil)
      @memory.drop_before(drop_before) if drop_before
      records = @memory.each_point.lazy.map { |key, t, v| Log::Record.new(key: key, time: t, value: v) }
      @log.compact(records)
      self
    end

    def close
      @log.close
    end
  end
end
