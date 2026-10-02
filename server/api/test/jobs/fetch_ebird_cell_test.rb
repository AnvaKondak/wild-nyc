require "test_helper"

class FetchEbirdCellTest < ActiveSupport::TestCase
  BODY = Rails.root.join("test/fixtures/files/ebird_recent.json").read
  TB = WildSeries::TimeBucket

  setup do
    @http = FakeHttp.new([200, BODY])
    FetchEbirdCell.client = EbirdClient.new(key: "test-key", http: @http, throttle: NO_WAIT)
  end

  teardown { FetchEbirdCell.client = nil }

  def days(species)
    @series.range({ cell: "dr5rke", species: species, source: "ebird" }).to_h { |p| [TB.to_date(p.time).iso8601, p.value] }
  end

  test "sends the key in a header and asks around the cell's center" do
    FetchEbirdCell.new.perform(cell: "dr5rke", today: "2026-10-01")
    uri, headers = @http.requests.first
    assert_equal "test-key", headers["X-eBirdApiToken"]
    refute_includes uri.to_s, "test-key", "the key never goes in the URL (it would end up in logs)"
    params = URI.decode_www_form(uri.query).to_h
    assert_equal "3", params["dist"]
    assert_in_delta 40.6686, params["lat"].to_f, 0.0001
  end

  test "marks days our birds were seen inside the cell" do
    FetchEbirdCell.new.perform(cell: "dr5rke", today: "2026-10-01")
    assert_equal({ "2026-09-30" => 1 }, days("rock-pigeon"))   # a flock of 14 is still one sighting
    assert_equal({ "2026-09-29" => 1 }, days("american-robin"))
    assert_equal({}, days("blue-jay"))                        # in Prospect Park, outside the block
    assert_equal 2, @series.keys.size                         # the cardinal isn't one of our species
    assert Cell.find("dr5rke").ebird_fetched_at
  end

  test "keeps earlier days when a newer sighting replaces them in eBird's answer" do
    FetchEbirdCell.new.perform(cell: "dr5rke", today: "2026-10-01")
    newer = [{ speciesCode: "rocpig", obsDt: "2026-10-01 09:00", lat: 40.668, lng: -73.976 }].to_json
    FetchEbirdCell.client = EbirdClient.new(key: "k", http: FakeHttp.new([200, newer]), throttle: NO_WAIT)
    FetchEbirdCell.new.perform(cell: "dr5rke", today: "2026-10-01")
    assert_equal({ "2026-09-30" => 1, "2026-10-01" => 1 }, days("rock-pigeon"))
  end

  test "does nothing without an API key" do
    FetchEbirdCell.client = nil
    with_env("EBIRD_API_KEY" => nil) { FetchEbirdCell.new.perform(cell: "dr5rke") }
    assert_equal 0, @series.series_count
  end

  def with_env(vars)
    old = vars.keys.to_h { |k| [k, ENV[k]] }
    vars.each { |k, v| ENV[k] = v }
    yield
  ensure
    old.each { |k, v| ENV[k] = v }
  end
end
