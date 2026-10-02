# Writes "how many times was each species seen on each day" for one cell and one
# source into the time-series store.
#
# Series are tagged { cell:, species:, source: }. Writes set values (see design 001),
# so re-running a fetch for the same window gives the same result. Days in the window
# that used to have sightings but now have none (an observation was deleted or
# re-identified) are set back to 0.
class DailyCounts
  def initialize(store = SeriesStore.writer)
    @store = store
  end

  # counts: { [species_id, Date] => Integer }
  def write(cell:, source:, counts:, from:, to:)
    window_from = WildSeries::TimeBucket.day(from)
    window_to = WildSeries::TimeBucket.day(to + 1)

    counts.each do |(species_id, date), n|
      @store.write(tags(cell, species_id, source), WildSeries::TimeBucket.day(date), n)
    end

    @store.keys(cell: cell, source: source).each do |key|
      species_id = key.tags["species"]
      @store.range(key.tags, window_from, window_to).each do |point|
        date = WildSeries::TimeBucket.to_date(point.time)
        next if point.value.zero? || counts.key?([species_id, date])

        @store.write(key.tags, point.time, 0)
      end
    end
  end

  private

  def tags(cell, species_id, source) = { cell: cell, species: species_id, source: source }
end
