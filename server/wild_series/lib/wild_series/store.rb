# frozen_string_literal: true

module WildSeries
  # A collection of series, looked up by tags.
  #
  #   store = WildSeries::Store.new
  #   store.write({ cell: "dr5rke", species: "rock-pigeon" }, day, 4)
  #   store.range({ cell: "dr5rke", species: "rock-pigeon" }, from, to)
  #   store.keys(cell: "dr5rke") # every species seen in that cell
  #
  # This class holds everything in memory. Persistence is added on top of it.
  class Store
    def initialize
      @series = {} # SeriesKey => Series
    end

    def write(tags, time, value)
      raise ArgumentError, "value must be a number" unless value.is_a?(Numeric)

      key = SeriesKey.new(tags)
      (@series[key] ||= Series.new).set(time, value)
      key
    end

    # Points for one series, oldest first. Empty if the series doesn't exist.
    def range(tags, from = nil, to = nil)
      series = @series[SeriesKey.new(tags)]
      series ? series.range(from, to) : []
    end

    # Keys of every series whose tags include `filter`.
    #
    # This is a full scan over series names. With one series per cell × species
    # that's thousands, not millions, so a scan is fine and keeps the code simple.
    # See docs/design/002-scan-before-index.md.
    def keys(filter = {})
      @series.keys.select { |key| key.matches?(filter) }.sort_by(&:to_s)
    end

    # One series, grouped into day or week buckets:
    #   store.rollup(PIGEONS, from, to, bucket: :week)  # weekly totals
    def rollup(tags, from = nil, to = nil, bucket:, fn: :sum)
      Aggregate.rollup(range(tags, from, to), bucket: bucket, fn: fn)
    end

    # Combines every matching series over a time range, grouped by one tag:
    #   store.group({ cell: "dr5rke" }, by: "species", from: a_month_ago, to: today)
    #   # => { "house-sparrow" => 12, "rock-pigeon" => 31 }
    # Series with no points in the range are left out.
    def group(filter = {}, by:, from: nil, to: nil, fn: :sum)
      by = by.to_s
      values_by_group = Hash.new { |h, k| h[k] = [] }
      keys(filter).each do |key|
        group_name = key.tags[by]
        next unless group_name # series without that tag can't be grouped by it
        points = @series[key].range(from, to)
        values_by_group[group_name].concat(points.map(&:value))
      end
      values_by_group
        .reject { |_, values| values.empty? }
        .transform_values { |values| Aggregate.apply(fn, values) }
    end

    # Retention: removes every point older than `cutoff`, and any series left empty.
    # Returns how many points were removed.
    def drop_before(cutoff)
      removed = @series.each_value.sum { |series| series.drop_before(cutoff) }
      @series.reject! { |_, series| series.empty? }
      removed
    end

    # Every point in every series, as [key, time, value]. Used by compaction.
    def each_point
      return enum_for(:each_point) unless block_given?

      @series.each { |key, series| series.each_point { |t, v| yield key, t, v } }
    end

    def series_count = @series.size
    def point_count = @series.each_value.sum(&:size)
  end
end
