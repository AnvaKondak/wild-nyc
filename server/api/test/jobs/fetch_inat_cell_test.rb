require "test_helper"

class FetchInatCellTest < ActiveSupport::TestCase
  BODY = Rails.root.join("test/fixtures/files/inat_dr5rke.json").read
  TB = WildSeries::TimeBucket

  setup do
    @http = FakeHttp.new([200, BODY])
    FetchInatCell.client = InatClient.new(http: @http, throttle: NO_WAIT)
  end

  teardown { FetchInatCell.client = nil }

  def counts(species, cell: "dr5rke")
    @series.range({ cell: cell, species: species, source: "inat" }).to_h { |p| [TB.to_date(p.time).iso8601, p.value] }
  end

  test "stores daily counts per species, and nothing else" do
    FetchInatCell.new.perform(cell: "dr5rke", today: "2026-10-01")

    # Two pigeons on the 28th (one is the domestic subspecies). The obscured one on
    # the 29th is left out.
    assert_equal({ "2026-09-28" => 2 }, counts("rock-pigeon"))
    # The hawk's species is obscured by iNaturalist: never placed in a cell.
    assert_equal({}, counts("red-tailed-hawk"))
    # The sparrow was just north of the cell, so it counts for that neighbor.
    assert_equal({}, counts("house-sparrow"))
    assert_equal({ "2026-09-30" => 1 }, counts("house-sparrow", cell: "dr5rks"))
    # A moth counts as "moths"; the Painted Lady butterfly doesn't; the Monarch is a Monarch.
    assert_equal({ "2026-09-30" => 1 }, counts("moths"))
    assert_equal({ "2026-09-30" => 1 }, counts("monarch"))

    tags = @series.keys.map(&:tags)
    assert(tags.all? { |t| t.keys.sort == %w[cell source species] }, "only cell, species and source are stored")
  end

  test "asks once for the whole 3x3 block" do
    FetchInatCell.new.perform(cell: "dr5rke", today: "2026-10-01")
    assert_equal 1, @http.requests.size
    params = URI.decode_www_form(@http.requests.first.first.query).to_h
    block = Geohash.block_bounds("dr5rke")
    assert_in_delta block.south, params["swlat"].to_f, 1e-9
    assert_in_delta block.east, params["nelng"].to_f, 1e-9
  end

  test "first run fetches a year, later runs a month" do
    FetchInatCell.new.perform(cell: "dr5rke", today: "2026-10-01")
    FetchInatCell.new.perform(cell: "dr5rke", today: "2026-10-01")
    d1s = @http.requests.map { |uri, _| URI.decode_www_form(uri.query).to_h["d1"] }
    assert_equal %w[2025-10-01 2026-09-01], d1s
    assert Cell.find("dr5rke").inat_fetched_at
  end

  test "re-running is idempotent and corrects counts that went away" do
    FetchInatCell.new.perform(cell: "dr5rke", today: "2026-10-01")
    FetchInatCell.new.perform(cell: "dr5rke", today: "2026-10-01")
    assert_equal({ "2026-09-28" => 2 }, counts("rock-pigeon"))

    # Later, iNaturalist has no pigeon observations any more (re-identified, say).
    FetchInatCell.client = InatClient.new(http: FakeHttp.new([200, { results: [] }.to_json]), throttle: NO_WAIT)
    FetchInatCell.new.perform(cell: "dr5rke", today: "2026-10-01")
    assert_equal({ "2026-09-28" => 0 }, counts("rock-pigeon"))
  end
end

class DailyCountsTest < ActiveSupport::TestCase
  test "only zeroes days inside the window" do
    store = WildSeries::Store.new
    tags = { cell: "dr5rke", species: "rock-pigeon", source: "inat" }
    store.write(tags, WildSeries::TimeBucket.day("2026-01-05"), 3) # outside the window
    store.write(tags, WildSeries::TimeBucket.day("2026-09-20"), 4) # inside, now gone

    DailyCounts.new(store).write(cell: "dr5rke", source: "inat", counts: {}, from: Date.new(2026, 9, 1), to: Date.new(2026, 10, 1))
    assert_equal [3, 0], store.range(tags).map(&:value)
  end
end
