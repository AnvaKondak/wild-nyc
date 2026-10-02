require "test_helper"

class CellTest < ActiveSupport::TestCase
  test "touch_requested! creates then updates the last request time" do
    t1 = Time.utc(2026, 10, 1, 12)
    cell = Cell.touch_requested!("dr5rke", now: t1)
    assert_equal t1, cell.last_requested_at
    refute cell.fetched?

    t2 = t1 + 3600
    assert_equal t2, Cell.touch_requested!("dr5rke", now: t2).last_requested_at
    assert_equal 1, Cell.count
  end

  test "active cells were requested recently" do
    Cell.touch_requested!("dr5rke", now: 2.days.ago)
    Cell.touch_requested!("dr5rkw", now: 60.days.ago)
    assert_equal ["dr5rke"], Cell.active.pluck(:geohash)
  end

  test "only stores a geohash and timestamps" do
    assert_equal %w[created_at ebird_fetched_at geohash inat_fetched_at last_requested_at updated_at], Cell.column_names.sort
  end
end
