# frozen_string_literal: true

module WildSeries
  # One point: a time (Integer seconds since the Unix epoch, UTC) and a number.
  Point = Data.define(:time, :value)

  # The points of one series, always kept sorted by time, at most one per timestamp.
  #
  # Writes *set* the value at a timestamp (last write wins) instead of adding to it.
  # That makes writes idempotent: a fetch job can safely re-write a day it has
  # written before. See docs/design/001-set-not-add.md.
  class Series
    def initialize
      @times = []  # sorted Integer timestamps
      @values = [] # @values[i] belongs to @times[i]
    end

    def size = @times.size
    def empty? = @times.empty?

    # Set the value at `time`. Points may arrive in any order.
    def set(time, value)
      time = Integer(time)
      i = index_at_or_after(time)
      if i < @times.size && @times[i] == time
        @values[i] = value # same timestamp: replace
      else
        @times.insert(i, time) # keep the arrays sorted
        @values.insert(i, value)
      end
    end

    # Points with from <= time < to, oldest first. Either bound can be nil (open).
    def range(from = nil, to = nil)
      start = from ? index_at_or_after(Integer(from)) : 0
      stop = to ? index_at_or_after(Integer(to)) : @times.size
      (start...stop).map { |i| Point.new(time: @times[i], value: @values[i]) }
    end

    # Remove points with time < cutoff. Returns how many were removed.
    def drop_before(cutoff)
      n = index_at_or_after(Integer(cutoff))
      @times.shift(n)
      @values.shift(n)
      n
    end

    def first_time = @times.first
    def last_time = @times.last

    private

    # Binary search: the first index whose time is >= `time` (or size if none).
    # O(log n), so lookups stay fast as a series grows.
    def index_at_or_after(time)
      @times.bsearch_index { |t| t >= time } || @times.size
    end
  end
end
