# frozen_string_literal: true

module WildSeries
  # Combines many values into one. Used by rollups and group-bys.
  module Aggregate
    FUNCTIONS = {
      sum: ->(values) { values.sum },
      max: ->(values) { values.max },
      min: ->(values) { values.min },
      count: ->(values) { values.size },
      mean: ->(values) { values.sum.fdiv(values.size) },
    }.freeze

    module_function

    def apply(fn, values)
      FUNCTIONS.fetch(fn) { raise ArgumentError, "unknown function #{fn.inspect}" }.call(values)
    end

    # Groups points into time buckets and combines each bucket's values.
    # Buckets with no points are left out rather than reported as zero.
    def rollup(points, bucket:, fn: :sum)
      points
        .group_by { |p| TimeBucket.floor(p.time, bucket) }
        .map { |start, group| Point.new(time: start, value: apply(fn, group.map(&:value))) }
        .sort_by(&:time)
    end
  end
end
