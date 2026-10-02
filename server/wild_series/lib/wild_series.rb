# frozen_string_literal: true

# A small time-series store, written from scratch.
# Start reading at Store; Series and SeriesKey are its building blocks.
module WildSeries
end

require_relative "wild_series/series_key"
require_relative "wild_series/series"
require_relative "wild_series/store"
