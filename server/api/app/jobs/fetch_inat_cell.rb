# Fetches iNaturalist observations for one neighborhood cell and stores daily counts
# per species. Never stores an observation, a point, or an observer.
class FetchInatCell
  include WildQueue::Job
  queue_name "fetch"
  max_attempts 6

  FIRST_FETCH = 365 # days of history the first time we see a cell
  REFETCH = 30      # later runs re-read a month, because uploads arrive late

  class << self
    attr_writer :client

    def client = (@client ||= InatClient.new)
  end

  def perform(cell:, today: nil)
    today = today ? Date.iso8601(today) : Date.current
    record = Cell.find_or_create_by!(geohash: cell) { |c| c.last_requested_at = Time.current }
    since = today - (record.inat_fetched_at ? REFETCH : FIRST_FETCH)
    matcher = SpeciesMatcher.new
    counts = Hash.new(0)

    self.class.client.observations(bounds: Geohash.bounds(cell), taxon_ids: matcher.taxon_ids, since: since) do |obs|
      next if obs.obscured # see InatClient#obscured? and design note 012
      next unless obs.observed_on && obs.lat
      next unless Geohash.encode(obs.lat, obs.lng) == cell # the box edges touch neighbors

      species = matcher.match(obs.taxon_ids) or next
      counts[[species.id, obs.observed_on]] += 1
    end

    DailyCounts.new.write(cell: cell, source: "inat", counts: counts, from: since, to: today)
    record.update!(inat_fetched_at: Time.current)
  end
end
