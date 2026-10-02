# frozen_string_literal: true

# A small time-series store, written from scratch.
# Start reading at Store; Series and SeriesKey are its building blocks.
require "date"

module WildSeries
end

require_relative "wild_series/series_key"
require_relative "wild_series/series"
require_relative "wild_series/time_bucket"
require_relative "wild_series/aggregate"
require_relative "wild_series/store"
