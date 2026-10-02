# Marks which of our birds eBird users reported recently in a cell and its 8
# neighbors.
# Like the iNaturalist job, it keeps only species + date + cell.
class FetchEbirdCell
  include WildQueue::Job
  queue_name "fetch"
  max_attempts 6

  RADIUS_KM = 3 # covers the ~3.6 x 1.8 km block; anything outside it is dropped

  class << self
    attr_writer :client

    def client = (@client ||= EbirdClient.new)
  end

  def perform(cell:, today: nil)
    return unless self.class.client_configured?

    today = today ? Date.iso8601(today) : Date.current
    record = Cell.find_or_create_by!(geohash: cell) { |c| c.last_requested_at = Time.current }
    lat, lng = Geohash.bounds(cell).center
    birds = Species.by_ebird_code
    seen = Geohash.block(cell).to_h { |c| [c, {}] } # cell => { [species_id, date] => 1 }

    self.class.client.recent(lat: lat, lng: lng, km: RADIUS_KM).each do |s|
      species = birds[s.species_code] or next
      in_cell = Geohash.encode(s.lat, s.lng)
      next unless seen.key?(in_cell)

      seen[in_cell][[species.id, s.observed_on]] = 1 # "seen that day", not a count: see design 013
    end

    # eBird only returns the latest sighting per species, so a day missing from this
    # response may still have had a sighting. Never zero out earlier days.
    seen.each do |c, marks|
      DailyCounts.new.write(cell: c, source: "ebird", counts: marks, from: today - 30, to: today, clear_missing: false)
    end
    record.update!(ebird_fetched_at: Time.current)
  end

  def self.client_configured? = @client.present? || EbirdClient.configured?
end
