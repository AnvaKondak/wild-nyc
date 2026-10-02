# Reads recent bird sightings from the eBird API 2.0. Needs a free key from
# https://ebird.org/api/keygen in the EBIRD_API_KEY environment variable.
# https://documenter.getpostman.com/view/664302/S1ENwy59
class EbirdClient
  class Error < StandardError; end

  BASE = "https://api.ebird.org/v2"

  Sighting = Data.define(:species_code, :observed_on, :lat, :lng)

  def self.configured? = ENV["EBIRD_API_KEY"].present?

  def initialize(key: ENV["EBIRD_API_KEY"], http: HttpGet, throttle: Throttle.new(0.5))
    @key = key
    @http = http
    @throttle = throttle
  end

  # The most recent sighting of each species within `km` of a point, from the last
  # `days` days (eBird allows up to 30). One sighting per species: eBird's API
  # doesn't offer full history.
  def recent(lat:, lng:, km:, days: 30)
    raise Error, "EBIRD_API_KEY is not set" if @key.blank?

    uri = URI("#{BASE}/data/obs/geo/recent")
    uri.query = URI.encode_www_form(lat: lat.round(4), lng: lng.round(4), dist: km, back: days)
    status, body = @throttle.call { @http.call(uri, "X-eBirdApiToken" => @key) }
    raise Error, "eBird returned #{status}" unless status == 200

    JSON.parse(body).map do |raw|
      Sighting.new(
        species_code: raw["speciesCode"],
        observed_on: Date.iso8601(raw["obsDt"][0, 10]), # "2026-09-30 08:15" -> date
        lat: raw["lat"],
        lng: raw["lng"]
      )
    end
  end
end
