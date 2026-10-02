# frozen_string_literal: true

require "fileutils"
require "zlib"

module WildSeries
  # The on-disk part: an append-only log split into numbered segment files.
  #
  #   data/
  #     LOCK            held (flock) by the one process allowed to write
  #     000001.log      older segment, full
  #     000002.log      active segment, appended to
  #
  # Each line is one write, with a checksum in front:
  #
  #   3f2a9c1e<TAB>cell=dr5rke,species=rock-pigeon<TAB>1790812800<TAB>4
  #   └ crc32 ┘    └────────── series key ─────────┘    └ time ─┘     └ value
  #
  # Plain text so it can be read with `cat` while debugging.
  #
  # A compacted segment starts with a "#base" line: it holds the whole state, so
  # every segment before it is ignored (and deleted by the writer).
  # See docs/design/004-append-only-log.md, 005-one-writer-many-readers.md and
  # 006-compaction-and-retention.md.
  class Log
    class Locked < StandardError; end
    class Corrupt < StandardError; end

    Record = Data.define(:key, :time, :value)

    SEGMENT_GLOB = "[0-9][0-9][0-9][0-9][0-9][0-9].log"
    BASE_MARKER = "#base\n"
    DEFAULT_SEGMENT_BYTES = 8 * 1024 * 1024

    attr_reader :dir

    # writable: true takes the lock, repairs a torn last line and opens for appending.
    # writable: false only ever reads, and can run alongside a writer.
    def initialize(dir, writable:, max_segment_bytes: DEFAULT_SEGMENT_BYTES, fsync: true)
      @dir = dir
      @writable = writable
      @max_segment_bytes = max_segment_bytes
      @fsync = fsync
      @offsets = {} # segment path => bytes already read from it
      FileUtils.mkdir_p(dir)

      if writable
        take_lock
        clean_up_after_compaction
        repair_tail
        open_active_segment
      end
    end

    # ---- writing ----

    def append(key, time, value)
      raise "log is read-only" unless @writable

      line = encode(key, time, value)
      rotate if @active.size + line.bytesize > @max_segment_bytes && @active.size.positive?
      @active.write(line)
      @active.flush
      @active.fsync if @fsync # survive a power cut, not just a crash
      @offsets[@active.path] = @active.size
    end

    # Replaces every segment with one new base segment holding `records` (the
    # whole current state). Steps, each safe to crash between:
    #   1. write NNNNNN.log.tmp and fsync it   (crash: the .tmp is deleted on open)
    #   2. rename it to NNNNNN.log             (atomic; from now on it's the base)
    #   3. delete the older segments           (crash: they're ignored, then deleted)
    def compact(records)
      raise "log is read-only" unless @writable

      old = all_segments
      path = segment_path(next_number)
      File.open("#{path}.tmp", "wb") do |f|
        f.write(BASE_MARKER)
        records.each { |r| f.write(encode(r.key, r.time, r.value)) }
        f.flush
        f.fsync
      end
      @active.close
      File.rename("#{path}.tmp", path)
      fsync_dir
      old.each { |p| File.delete(p) }

      @active = File.open(path, "ab")
      @offsets = { path => @active.size }
    end

    # ---- reading ----

    # The segments that count: the newest base segment and everything after it.
    def segments
      all = all_segments
      base = all.rindex { |path| base?(path) }
      base ? all[base..] : all
    end

    # Yields every record not read yet, oldest first, and remembers how far it got.
    # The first call reads everything. Only whole lines are read, so a reader never
    # sees half of a write that's still in progress.
    def read_new
      segments.each do |path|
        offset = @offsets.fetch(path, 0)
        next if File.size(path) <= offset

        File.open(path, "rb") do |f|
          f.seek(offset)
          while (line = f.gets)
            break unless line.end_with?("\n") # still being written; read it next time

            yield parse!(line, path) unless line == BASE_MARKER
            offset += line.bytesize
          end
        end
        @offsets[path] = offset
      end
    end

    # True if a segment this reader has read from is gone, which happens after a
    # compaction. The caller must then start over from an empty store.
    def segments_replaced?
      current = segments
      @offsets.keys.any? { |path| !current.include?(path) }
    end

    def reset
      @offsets.clear
    end

    def close
      @active&.close
      @lock&.close # closing the file releases the flock
      @active = @lock = nil
    end

    private

    def take_lock
      @lock = File.open(File.join(@dir, "LOCK"), File::RDWR | File::CREAT)
      return if @lock.flock(File::LOCK_EX | File::LOCK_NB)

      @lock.close
      raise Locked, "another process is writing to #{@dir}"
    end

    def all_segments
      Dir.glob(File.join(@dir, SEGMENT_GLOB)).sort
    end

    def base?(path)
      File.open(path, "rb") { |f| f.gets == BASE_MARKER }
    end

    # Finishes or undoes a compaction that was interrupted by a crash.
    def clean_up_after_compaction
      Dir.glob(File.join(@dir, "*.log.tmp")).each { |p| File.delete(p) }
      (all_segments - segments).each { |p| File.delete(p) }
    end

    # A crash in the middle of `append` can leave half a line at the end of the
    # last segment. That write never finished, so it's safe to cut it off.
    # Damage anywhere else means something went really wrong: refuse to guess.
    def repair_tail
      paths = segments
      paths.each do |path|
        good_bytes = valid_prefix_bytes(path)
        next if good_bytes == File.size(path)
        raise Corrupt, "damaged record in #{File.basename(path)} at byte #{good_bytes}" unless path == paths.last

        File.truncate(path, good_bytes)
      end
    end

    # How many bytes from the start of the file are complete, valid lines.
    def valid_prefix_bytes(path)
      bytes = 0
      File.open(path, "rb") do |f|
        while (line = f.gets)
          break unless line.end_with?("\n") && valid?(line)

          bytes += line.bytesize
        end
      end
      bytes
    end

    def valid?(line)
      return true if line == BASE_MARKER

      crc, payload = line.chomp.split("\t", 2)
      !payload.nil? && crc == format("%08x", Zlib.crc32(payload))
    end

    def parse!(line, path)
      raise Corrupt, "bad checksum in #{File.basename(path)}" unless valid?(line)

      _crc, key, time, value = line.chomp.split("\t")
      Record.new(key: key, time: Integer(time), value: parse_number(value))
    end

    def encode(key, time, value)
      payload = "#{key}\t#{Integer(time)}\t#{value}"
      format("%08x\t%s\n", Zlib.crc32(payload), payload)
    end

    def parse_number(text)
      text.match?(/\A-?\d+\z/) ? Integer(text) : Float(text)
    end

    def open_active_segment
      path = segments.last || segment_path(1)
      @active = File.open(path, "ab")
    end

    def rotate
      @active.close
      @active = File.open(segment_path(next_number), "ab")
    end

    def next_number
      last = all_segments.last
      last ? Integer(File.basename(last, ".log"), 10) + 1 : 1
    end

    # Makes the rename itself durable, not just the file's contents.
    def fsync_dir
      File.open(@dir) { |d| d.fsync }
    rescue Errno::EINVAL, Errno::EISDIR
      # Some filesystems don't support fsync on a directory; the rename still happened.
    end

    def segment_path(number)
      File.join(@dir, format("%06d.log", number))
    end
  end
end
