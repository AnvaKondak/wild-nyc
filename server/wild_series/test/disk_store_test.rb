require "test_helper"
require "tmpdir"

class DiskStoreTest < Minitest::Test
  PIGEONS = { cell: "dr5rke", species: "rock-pigeon" }.freeze
  SPARROWS = { cell: "dr5rke", species: "house-sparrow" }.freeze

  def setup
    @dir = Dir.mktmpdir("wild_series")
  end

  def teardown
    @stores&.each(&:close)
    FileUtils.remove_entry(@dir)
  end

  def open(**opts)
    (@stores ||= []) << WildSeries::DiskStore.open(@dir, **opts)
    @stores.last
  end

  def close_all
    @stores.each(&:close)
    @stores = []
  end

  def test_survives_a_restart
    s = open
    s.write(PIGEONS, 100, 4)
    s.write(PIGEONS, 200, 2.5)
    s.write(PIGEONS, 100, 5) # replaces the first write
    close_all

    assert_equal [[100, 5], [200, 2.5]], open.range(PIGEONS).map { |p| [p.time, p.value] }
  end

  def test_log_is_plain_text_with_checksums
    s = open
    s.write(PIGEONS, 100, 4)
    line = File.read(File.join(@dir, "000001.log"))
    assert_match(/\A\h{8}\tcell=dr5rke,species=rock-pigeon\t100\t4\n\z/, line)
  end

  def test_cuts_off_a_half_written_last_line
    open.write(PIGEONS, 100, 4)
    close_all
    File.open(File.join(@dir, "000001.log"), "ab") { |f| f.write("deadbeef\tcell=dr5rke,spec") } # crash mid-write

    s = open
    assert_equal [4], s.range(PIGEONS).map(&:value)
    s.write(PIGEONS, 200, 6) # appends cleanly after the repair
    close_all
    assert_equal [4, 6], open.range(PIGEONS).map(&:value)
  end

  def test_drops_a_last_line_with_a_bad_checksum
    open.write(PIGEONS, 100, 4)
    close_all
    File.open(File.join(@dir, "000001.log"), "ab") { |f| f.write("00000000\tcell=dr5rke,species=rock-pigeon\t200\t6\n") }
    assert_equal [4], open.range(PIGEONS).map(&:value)
  end

  def test_refuses_to_open_when_an_older_segment_is_damaged
    s = open(max_segment_bytes: 60)
    3.times { |i| s.write(PIGEONS, i, i) }
    close_all
    first = File.join(@dir, "000001.log")
    File.write(first, File.read(first).sub("rock", "rick")) # flip bytes inside a full segment

    assert_raises(WildSeries::Log::Corrupt) { open }
  end

  def test_rotates_into_new_segments_and_replays_them_in_order
    s = open(max_segment_bytes: 60) # roughly one line per segment
    5.times { |i| s.write(PIGEONS, i * 10, i) }
    assert_operator Dir.glob(File.join(@dir, "*.log")).size, :>, 1
    close_all

    assert_equal [0, 1, 2, 3, 4], open.range(PIGEONS).map(&:value)
  end

  def test_only_one_writer_at_a_time
    open
    assert_raises(WildSeries::Log::Locked) { open }
  end

  def test_reader_sees_new_writes_after_refresh
    writer = open
    writer.write(PIGEONS, 100, 4)
    reader = open(writable: false)
    assert_equal [4], reader.range(PIGEONS).map(&:value)

    writer.write(SPARROWS, 100, 9)
    assert_equal [], reader.range(SPARROWS)
    reader.refresh
    assert_equal [9], reader.range(SPARROWS).map(&:value)
  end

  def test_reader_waits_for_a_line_to_be_complete
    writer = open
    writer.write(PIGEONS, 100, 4)
    reader = open(writable: false)
    path = File.join(@dir, "000001.log")
    File.open(path, "ab") { |f| f.write("abc") } # a writer midway through a line
    reader.refresh
    assert_equal [4], reader.range(PIGEONS).map(&:value)
  end

  def test_rejects_bad_values_before_touching_disk
    s = open
    assert_raises(ArgumentError) { s.write(PIGEONS, 100, "four") }
    assert_raises(ArgumentError) { s.write({ cell: "a,b" }, 100, 1) }
    assert_equal 0, File.size(File.join(@dir, "000001.log"))
  end
end
