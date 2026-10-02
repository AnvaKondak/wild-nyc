require "test_helper"
require "tmpdir"

class CompactionTest < Minitest::Test
  PIGEONS = { cell: "dr5rke", species: "rock-pigeon" }.freeze
  SPARROWS = { cell: "dr5rke", species: "house-sparrow" }.freeze

  def setup
    @dir = Dir.mktmpdir("wild_series")
    @open = []
  end

  def teardown
    @open.each(&:close)
    FileUtils.remove_entry(@dir)
  end

  def open(**opts)
    @open << WildSeries::DiskStore.open(@dir, **opts)
    @open.last
  end

  def close_all
    @open.each(&:close)
    @open.clear
  end

  def log_lines
    Dir.glob(File.join(@dir, "*.log")).sort.flat_map { |p| File.readlines(p) }
  end

  def test_compaction_keeps_only_the_latest_value_for_each_point
    s = open(max_segment_bytes: 200)
    10.times { |i| s.write(PIGEONS, 100, i) } # ten overwrites of one point
    s.write(SPARROWS, 100, 3)
    assert_equal 11, log_lines.size

    s.compact
    assert_equal ["#base\n"], log_lines.first(1)
    assert_equal 3, log_lines.size # marker + one line per point
    assert_equal 1, Dir.glob(File.join(@dir, "*.log")).size
    close_all

    reopened = open
    assert_equal [9], reopened.range(PIGEONS).map(&:value)
    assert_equal [3], reopened.range(SPARROWS).map(&:value)
  end

  def test_writes_after_compaction_go_after_the_base
    s = open
    s.write(PIGEONS, 100, 1)
    s.compact
    s.write(PIGEONS, 200, 2)
    close_all
    assert_equal [1, 2], open.range(PIGEONS).map(&:value)
  end

  def test_retention_drops_old_points_and_empty_series_for_good
    s = open
    s.write(PIGEONS, 100, 1)
    s.write(PIGEONS, 300, 3)
    s.write(SPARROWS, 100, 9) # only has old points
    s.compact(drop_before: 200)
    assert_equal [3], s.range(PIGEONS).map(&:value)
    assert_equal 1, s.series_count
    close_all

    reopened = open
    assert_equal [3], reopened.range(PIGEONS).map(&:value)
    assert_equal [], reopened.range(SPARROWS)
  end

  def test_crash_after_rename_does_not_bring_dropped_points_back
    s = open
    s.write(PIGEONS, 100, 1)
    s.write(PIGEONS, 300, 3)
    close_all
    # Simulate a crash after step 2: the new base exists, the old segment wasn't deleted.
    payload = "cell=dr5rke,species=rock-pigeon\t300\t3"
    File.write(File.join(@dir, "000002.log"), "#base\n" + format("%08x\t%s\n", Zlib.crc32(payload), payload))

    reopened = open
    assert_equal [3], reopened.range(PIGEONS).map(&:value)
    refute File.exist?(File.join(@dir, "000001.log")), "the writer finishes the cleanup"
  end

  def test_crash_before_rename_leaves_the_old_data_untouched
    s = open
    s.write(PIGEONS, 100, 1)
    close_all
    File.write(File.join(@dir, "000002.log.tmp"), "#base\n") # half-finished compaction

    assert_equal [1], open.range(PIGEONS).map(&:value)
    refute File.exist?(File.join(@dir, "000002.log.tmp"))
  end

  def test_reader_rebuilds_after_the_writer_compacts
    writer = open
    writer.write(PIGEONS, 100, 1)
    writer.write(PIGEONS, 300, 3)
    reader = open(writable: false)
    assert_equal [1, 3], reader.range(PIGEONS).map(&:value)

    writer.compact(drop_before: 200)
    writer.write(SPARROWS, 400, 4)
    reader.refresh
    assert_equal [3], reader.range(PIGEONS).map(&:value)
    assert_equal [4], reader.range(SPARROWS).map(&:value)
  end
end
