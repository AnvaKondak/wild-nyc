# What the app gets for a cell: which species have been seen around it, how often
# lately, and a weekly trend. Built from the time-series store, across the cell and
# its 8 neighbors and across both sources.
class NeighborhoodReport
  RECENT_DAYS = 30
  YEAR_DAYS = 365
  TREND_WEEKS = 12

  SpeciesLine = Data.define(:id, :recent, :year, :last_seen_on, :weekly)

  def initialize(cell, today: Date.current)
    @cell = cell
    @today = today
  end

  def species(store)
    year_from = WildSeries::TimeBucket.day(@today - YEAR_DAYS + 1)
    to = WildSeries::TimeBucket.day(@today + 1)
    points_by_species = Hash.new { |h, k| h[k] = [] }

    Geohash.block(@cell).each do |cell|
      store.keys(cell: cell).each do |key|
        points_by_species[key.tags["species"]].concat(store.range(key.tags, year_from, to))
      end
    end

    points_by_species
      .filter_map { |id, points| line(id, points.reject { |p| p.value.zero? }) }
      .sort_by { |l| [-l.recent, -l.year, l.id] }
  end

  private

  def line(id, points)
    return if points.empty?

    recent_from = WildSeries::TimeBucket.day(@today - RECENT_DAYS + 1)
    SpeciesLine.new(
      id: id,
      recent: points.select { |p| p.time >= recent_from }.sum(&:value),
      year: points.sum(&:value),
      last_seen_on: WildSeries::TimeBucket.to_date(points.map(&:time).max),
      weekly: weekly(points)
    )
  end

  # Totals for the last TREND_WEEKS Monday-to-Sunday weeks, oldest first, zeros
  # included so the app can draw it directly.
  def weekly(points)
    this_week = WildSeries::TimeBucket.floor(WildSeries::TimeBucket.day(@today), :week)
    starts = (0...TREND_WEEKS).map { |i| this_week - (TREND_WEEKS - 1 - i) * WildSeries::TimeBucket::WEEK }
    totals = WildSeries::Aggregate.rollup(points, bucket: :week).to_h { |p| [p.time, p.value] }
    starts.map { |t| totals.fetch(t, 0) }
  end
end
