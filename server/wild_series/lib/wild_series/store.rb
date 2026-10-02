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

    def series_count = @series.size
    def point_count = @series.each_value.sum(&:size)
  end
end
