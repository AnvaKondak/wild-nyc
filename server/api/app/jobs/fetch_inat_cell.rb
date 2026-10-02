# Fetches iNaturalist observations for a cell and its 8 neighbors (one query for the
# whole block) and stores daily counts per cell and species. Never stores an
# observation, a point, or an observer.
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
    block = Geohash.block(cell)
    counts = block.to_h { |c| [c, Hash.new(0)] } # cell => { [species_id, date] => n }

    self.class.client.observations(bounds: Geohash.block_bounds(cell), taxon_ids: matcher.taxon_ids, since: since) do |obs|
      next if obs.obscured # see InatClient#obscured? and design note 012
      next unless obs.observed_on && obs.lat

      in_cell = Geohash.encode(obs.lat, obs.lng)
      next unless counts.key?(in_cell) # the box's edges touch cells outside the block

      species = matcher.match(obs.taxon_ids) or next
      counts[in_cell][[species.id, obs.observed_on]] += 1
    end

    counts.each do |c, cell_counts|
      DailyCounts.new.write(cell: c, source: "inat", counts: cell_counts, from: since, to: today)
    end
    record.update!(inat_fetched_at: Time.current)
  end
end
