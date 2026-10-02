require "test_helper"

class GeohashTest < ActiveSupport::TestCase
  test "matches the reference value and the app's encoder" do
    assert_equal "u4pruydqqvj", Geohash.encode(57.64911, 10.40744, 11)
    # Same cell the app computes for Park Slope's center (see the app's seed data).
    assert_equal "dr5rke", Geohash.encode(40.671, -73.9814)
  end

  test "bounds contain the point and round-trip" do
    b = Geohash.bounds("dr5rke")
    assert_operator b.south, :<=, 40.671
    assert_operator b.north, :>=, 40.671
    assert_equal "dr5rke", Geohash.encode(*b.center)
    assert_in_delta 0.0055, b.north - b.south, 0.0001 # ~0.6 km tall
    assert_in_delta 0.011, b.east - b.west, 0.0001   # ~1.2 km wide at the equator
  end

  test "block is the cell and its 8 neighbors" do
    block = Geohash.block("dr5rke")
    assert_equal 9, block.size
    assert_includes block, "dr5rke"
    assert(block.all? { |h| h.match?(Geohash::CELL_FORMAT) })
  end

  test "cell format" do
    assert "dr5rke".match?(Geohash::CELL_FORMAT)
    refute "dr5rk".match?(Geohash::CELL_FORMAT)
    refute "dr5rka".match?(Geohash::CELL_FORMAT) # 'a' isn't in the alphabet
  end
end
