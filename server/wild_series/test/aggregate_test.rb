require "test_helper"

class TimeBucketTest < Minitest::Test
  TB = WildSeries::TimeBucket

  def test_day_turns_a_date_into_midnight_utc
    assert_equal Time.utc(2026, 10, 1).to_i, TB.day("2026-10-01")
    assert_equal Date.new(2026, 10, 1), TB.to_date(TB.day("2026-10-01"))
  end

  def test_floor_to_day
    noonish = Time.utc(2026, 10, 1, 13, 45).to_i
    assert_equal TB.day("2026-10-01"), TB.floor(noonish, :day)
  end

  def test_floor_to_week_starts_on_monday
    # 2026-10-01 is a Thursday; its week starts Monday 2026-09-28.
    assert_equal TB.day("2026-09-28"), TB.floor(TB.day("2026-10-01"), :week)
    assert_equal TB.day("2026-09-28"), TB.floor(TB.day("2026-09-28"), :week)
    # Sunday still belongs to the week that started the Monday before.
    assert_equal TB.day("2026-09-28"), TB.floor(TB.day("2026-10-04"), :week)
    assert_equal TB.day("2026-10-05"), TB.floor(TB.day("2026-10-05"), :week)
  end

  def test_unknown_bucket
    assert_raises(ArgumentError) { TB.floor(0, :month) }
  end
end

class AggregateTest < Minitest::Test
  TB = WildSeries::TimeBucket
  PIGEONS = { cell: "dr5rke", species: "rock-pigeon" }.freeze

  def setup
    @store = WildSeries::Store.new
    # Mon 28 Sep: 2, Wed 30 Sep: 3, Mon 5 Oct: 7
    @store.write(PIGEONS, TB.day("2026-09-28"), 2)
    @store.write(PIGEONS, TB.day("2026-09-30"), 3)
    @store.write(PIGEONS, TB.day("2026-10-05"), 7)
  end

  def test_rollup_days_into_weeks
    weeks = @store.rollup(PIGEONS, bucket: :week)
    assert_equal [TB.day("2026-09-28"), TB.day("2026-10-05")], weeks.map(&:time)
    assert_equal [5, 7], weeks.map(&:value)
  end

  def test_rollup_with_other_functions
    assert_equal [3, 7], @store.rollup(PIGEONS, bucket: :week, fn: :max).map(&:value)
    assert_equal [2, 1], @store.rollup(PIGEONS, bucket: :week, fn: :count).map(&:value)
    assert_equal [2.5, 7.0], @store.rollup(PIGEONS, bucket: :week, fn: :mean).map(&:value)
  end

  def test_rollup_leaves_out_empty_buckets
    @store.write(PIGEONS, TB.day("2026-10-26"), 1)
    assert_equal 3, @store.rollup(PIGEONS, bucket: :week).size
  end

  def test_group_by_species_in_a_cell
    @store.write({ cell: "dr5rke", species: "house-sparrow" }, TB.day("2026-10-01"), 9)
    @store.write({ cell: "dr5rkw", species: "house-sparrow" }, TB.day("2026-10-01"), 100)
    totals = @store.group({ cell: "dr5rke" }, by: :species, from: TB.day("2026-09-29"), to: TB.day("2026-10-06"))
    assert_equal({ "rock-pigeon" => 10, "house-sparrow" => 9 }, totals)
  end

  def test_group_leaves_out_series_with_nothing_in_range
    totals = @store.group({ cell: "dr5rke" }, by: :species, from: TB.day("2027-01-01"))
    assert_equal({}, totals)
  end

  def test_group_skips_series_without_the_group_tag
    @store.write({ cell: "dr5rke" }, TB.day("2026-10-01"), 50)
    totals = @store.group({ cell: "dr5rke" }, by: :species)
    assert_equal %w[rock-pigeon], totals.keys
  end

  def test_unknown_function
    assert_raises(ArgumentError) { @store.rollup(PIGEONS, bucket: :week, fn: :median) }
  end
end
