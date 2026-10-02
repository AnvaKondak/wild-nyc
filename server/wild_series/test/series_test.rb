require "test_helper"

class SeriesKeyTest < Minitest::Test
  def test_same_tags_in_any_order_give_the_same_key
    a = WildSeries::SeriesKey.new(cell: "dr5rke", species: "rock-pigeon")
    b = WildSeries::SeriesKey.new("species" => "rock-pigeon", "cell" => "dr5rke")
    assert_equal "cell=dr5rke,species=rock-pigeon", a.to_s
    assert_equal a, b
    assert_equal a.hash, b.hash
  end

  def test_parse_round_trips
    key = WildSeries::SeriesKey.new(cell: "dr5rke", species: "rock-pigeon")
    assert_equal key, WildSeries::SeriesKey.parse(key.to_s)
  end

  def test_rejects_separator_characters_and_empty_tags
    assert_raises(ArgumentError) { WildSeries::SeriesKey.new(cell: "a,b") }
    assert_raises(ArgumentError) { WildSeries::SeriesKey.new(cell: "a=b") }
    assert_raises(ArgumentError) { WildSeries::SeriesKey.new({}) }
  end

  def test_matches_a_subset_of_tags
    key = WildSeries::SeriesKey.new(cell: "dr5rke", species: "rock-pigeon")
    assert key.matches?(cell: "dr5rke")
    assert key.matches?({})
    refute key.matches?(cell: "dr5rkf")
    refute key.matches?(source: "inat")
  end
end

class SeriesTest < Minitest::Test
  def setup
    @s = WildSeries::Series.new
  end

  def test_keeps_points_sorted_when_written_out_of_order
    @s.set(30, 3)
    @s.set(10, 1)
    @s.set(20, 2)
    assert_equal [10, 20, 30], @s.range.map(&:time)
  end

  def test_setting_the_same_time_replaces_the_value
    @s.set(10, 1)
    @s.set(10, 5)
    assert_equal 1, @s.size
    assert_equal [WildSeries::Point.new(time: 10, value: 5)], @s.range
  end

  def test_range_includes_from_and_excludes_to
    [10, 20, 30, 40].each { |t| @s.set(t, t) }
    assert_equal [20, 30], @s.range(20, 40).map(&:time)
    assert_equal [10, 20], @s.range(nil, 30).map(&:time)
    assert_equal [30, 40], @s.range(25, nil).map(&:time)
    assert_equal [], @s.range(41, 50)
  end

  def test_drop_before
    [10, 20, 30].each { |t| @s.set(t, t) }
    assert_equal 2, @s.drop_before(25)
    assert_equal [30], @s.range.map(&:time)
  end
end

class StoreTest < Minitest::Test
  PIGEONS = { cell: "dr5rke", species: "rock-pigeon" }.freeze
  SPARROWS = { cell: "dr5rke", species: "house-sparrow" }.freeze
  PARK_PIGEONS = { cell: "dr5rkw", species: "rock-pigeon" }.freeze

  def setup
    @store = WildSeries::Store.new
  end

  def test_write_and_read_back
    @store.write(PIGEONS, 100, 4)
    @store.write(PIGEONS, 200, 6)
    assert_equal [4, 6], @store.range(PIGEONS).map(&:value)
    assert_equal [6], @store.range(PIGEONS, 150, 300).map(&:value)
  end

  def test_unknown_series_reads_as_empty
    assert_equal [], @store.range(SPARROWS)
  end

  def test_rewriting_a_point_does_not_double_count
    @store.write(PIGEONS, 100, 4)
    @store.write(PIGEONS, 100, 4)
    assert_equal 1, @store.point_count
  end

  def test_keys_finds_every_series_in_a_cell
    @store.write(PIGEONS, 100, 1)
    @store.write(SPARROWS, 100, 1)
    @store.write(PARK_PIGEONS, 100, 1)
    assert_equal %w[house-sparrow rock-pigeon], @store.keys(cell: "dr5rke").map { |k| k.tags["species"] }
    assert_equal 3, @store.keys.size
  end

  def test_values_must_be_numbers
    assert_raises(ArgumentError) { @store.write(PIGEONS, 100, "4") }
  end
end
