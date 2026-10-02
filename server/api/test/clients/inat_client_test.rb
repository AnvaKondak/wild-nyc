require "test_helper"

class InatClientTest < ActiveSupport::TestCase
  BODY = Rails.root.join("test/fixtures/files/inat_dr5rke.json").read

  test "asks for the cell's box, our taxa, and verifiable observations since a date" do
    http = FakeHttp.new([200, BODY])
    InatClient.new(http: http, throttle: NO_WAIT)
              .observations(bounds: Geohash.bounds("dr5rke"), taxon_ids: [3017, 13858], since: Date.new(2026, 9, 1)) { }

    params = URI.decode_www_form(http.requests.first.first.query).to_h
    assert_equal "3017,13858", params["taxon_id"]
    assert_equal "2026-09-01", params["d1"]
    assert_equal "true", params["verifiable"]
    assert_equal "0", params["id_above"]
    assert_in_delta 40.66589, params["swlat"].to_f, 0.0001
  end

  test "parses observations and flags every kind of obscured location" do
    obs = []
    InatClient.new(http: FakeHttp.new([200, BODY]), throttle: NO_WAIT)
              .observations(bounds: Geohash.bounds("dr5rke"), taxon_ids: [1], since: Date.new(2026, 1, 1)) { |o| obs << o }

    assert_equal 8, obs.size
    first = obs.first
    assert_equal Date.new(2026, 9, 28), first.observed_on
    assert_in_delta 40.668, first.lat
    assert_includes first.taxon_ids, 3017
    assert_equal [false, false, true, true, false, false, false, false], obs.map(&:obscured)
  end

  test "pages by id until a short page" do
    full = { "results" => Array.new(InatClient::PER_PAGE) { |i| { "id" => i + 1, "observed_on" => "2026-09-01", "location" => "40.668,-73.976", "taxon" => { "id" => 3017 } } } }
    last = { "results" => [{ "id" => 999, "observed_on" => "2026-09-02", "location" => "40.668,-73.976", "taxon" => { "id" => 3017 } }] }
    http = FakeHttp.new([200, full.to_json], [200, last.to_json])
    count = 0
    InatClient.new(http: http, throttle: NO_WAIT).observations(bounds: Geohash.bounds("dr5rke"), taxon_ids: [3017], since: Date.today) { count += 1 }

    assert_equal 201, count
    assert_equal "200", URI.decode_www_form(http.requests.last.first.query).to_h["id_above"]
  end

  test "raises on errors so the job retries" do
    assert_raises(InatClient::Error) do
      InatClient.new(http: FakeHttp.new([503, "busy"]), throttle: NO_WAIT)
                .observations(bounds: Geohash.bounds("dr5rke"), taxon_ids: [1], since: Date.today) { }
    end
  end
end

class ThrottleTest < ActiveSupport::TestCase
  test "waits out the rest of the interval between calls" do
    now = 100.0
    slept = []
    throttle = Throttle.new(1.0, clock: -> { now }, sleeper: ->(s) { slept << s; now += s })
    throttle.call { }
    now += 0.25
    throttle.call { }
    assert_equal [0.75], slept
  end
end
