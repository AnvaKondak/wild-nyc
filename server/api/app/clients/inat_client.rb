# Reads observations from the iNaturalist API (v1). No key needed.
# https://api.inaturalist.org/v1/docs/
class InatClient
  class Error < StandardError; end

  BASE = "https://api.inaturalist.org/v1"
  PER_PAGE = 200
  MAX_PAGES = 25 # 5,000 observations per call is far more than one small area has

  # Only what we use from each observation.
  Observation = Data.define(:id, :observed_on, :lat, :lng, :taxon_ids, :obscured)

  def initialize(http: HttpGet, throttle: Throttle.new(1.0))
    @http = http
    @throttle = throttle
  end

  # Yields every verifiable observation of the given taxa inside `bounds` since
  # `since` (a Date). Pages through by id, the way iNaturalist recommends for
  # large result sets.
  def observations(bounds:, taxon_ids:, since:)
    id_above = 0
    MAX_PAGES.times do
      results = get_page(bounds, taxon_ids, since, id_above)
      results.each { |raw| yield parse(raw) }
      break if results.size < PER_PAGE

      id_above = results.last["id"]
    end
  end

  private

  def get_page(bounds, taxon_ids, since, id_above)
    uri = URI("#{BASE}/observations")
    uri.query = URI.encode_www_form(
      swlat: bounds.south, swlng: bounds.west, nelat: bounds.north, nelng: bounds.east,
      taxon_id: taxon_ids.join(","), d1: since.iso8601, verifiable: true,
      order_by: "id", order: "asc", id_above: id_above, per_page: PER_PAGE
    )
    status, body = @throttle.call { @http.call(uri) }
    raise Error, "iNaturalist returned #{status}" unless status == 200

    JSON.parse(body).fetch("results")
  end

  def parse(raw)
    lat, lng = raw["location"]&.split(",")&.map(&:to_f)
    taxon = raw["taxon"] || {}
    Observation.new(
      id: raw["id"],
      observed_on: raw["observed_on"] && Date.iso8601(raw["observed_on"]),
      lat: lat,
      lng: lng,
      taxon_ids: [*taxon["ancestor_ids"], taxon["id"]].compact,
      obscured: obscured?(raw)
    )
  end

  # iNaturalist hides the true location when the observer asks (geoprivacy) or the
  # species is sensitive (taxon_geoprivacy). The public coordinates are then
  # randomized inside a ~20 km box, so they must never be placed in a small cell.
  def obscured?(raw)
    raw["obscured"] == true ||
      %w[obscured private].include?(raw["geoprivacy"]) ||
      %w[obscured private].include?(raw["taxon_geoprivacy"])
  end
end
