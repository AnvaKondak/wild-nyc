require "test_helper"

class NeighborhoodsTest < ActionDispatch::IntegrationTest
  TB = WildSeries::TimeBucket

  def write(cell, species, date, n, source: "inat")
    @series.write({ cell: cell, species: species, source: source }, TB.day(date), n)
  end

  def jobs
    WildQueue::Backends::Postgres.new(ActiveRecord::Base.connection.raw_connection)
  end

  test "a new cell is warming up and queues a fetch" do
    get "/v1/neighborhoods/dr5rke"
    assert_response :success
    body = response.parsed_body
    assert_equal "warming_up", body["status"]
    assert_equal [], body["species"]
    assert_equal({ "ready" => 1 }, jobs.counts)

    get "/v1/neighborhoods/dr5rke" # asking again doesn't queue a second fetch
    assert_equal({ "ready" => 1 }, jobs.counts)
  end

  test "reports species across the cell and its neighbors, both sources" do
    travel_to Time.zone.local(2026, 10, 1, 12) do
      Cell.touch_requested!("dr5rke").update!(inat_fetched_at: Time.current)
      write("dr5rke", "rock-pigeon", "2026-09-28", 2)
      write("dr5rks", "rock-pigeon", "2026-09-30", 1)              # the neighbor to the north
      write("dr5rke", "rock-pigeon", "2026-09-30", 1, source: "ebird")
      write("dr5rke", "dark-eyed-junco", "2026-01-10", 3)          # earlier this year
      write("dr5rke", "moths", "2026-09-20", 0)                    # zeroed: not reported
      write("dr5rkw", "blue-jay", "2026-09-30", 5)                 # far away cell, not in the block

      get "/v1/neighborhoods/dr5rke"
    end

    body = response.parsed_body
    assert_equal "ready", body["status"]
    assert_equal %w[rock-pigeon dark-eyed-junco], body["species"].map { |s| s["id"] }

    pigeons = body["species"].first
    assert_equal 4, pigeons["recent"]
    assert_equal 4, pigeons["year"]
    assert_equal "2026-09-30", pigeons["lastSeenOn"]
    assert_equal 12, pigeons["weekly"].size
    assert_equal 4, pigeons["weekly"].last # week of Mon 28 Sep

    juncos = body["species"].last
    assert_equal [0, 3], [juncos["recent"], juncos["year"]]
    assert_equal({ "recentDays" => 30, "yearDays" => 365 }, body["window"])
  end

  test "rejects things that aren't cells" do
    get "/v1/neighborhoods/dr5rk"
    assert_response :unprocessable_content
    get "/v1/neighborhoods/40.67,-73.98"
    assert_response :unprocessable_content
    assert_equal 0, Cell.count
  end

  test "refuses cells outside NYC and Jersey City" do
    get "/v1/neighborhoods/gcpvj0" # London
    assert_response :not_found
    assert_equal 0, Cell.count
    assert_equal({}, jobs.counts)
  end

  test "stores nothing about the requester" do
    get "/v1/neighborhoods/dr5rke", headers: { "REMOTE_ADDR" => "203.0.113.7", "User-Agent" => "WildNeighbors/1.0 (iPhone)" }
    dump = Cell.all.map(&:attributes).to_s + jobs.counts.to_s
    refute_includes dump, "203.0.113.7"
    refute_includes dump, "iPhone"
  end
end
