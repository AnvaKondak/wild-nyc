# frozen_string_literal: true

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
  # See docs/design/004-append-only-log.md and 005-one-writer-many-readers.md.
  class Log
    class Locked < StandardError; end
    class Corrupt < StandardError; end

    Record = Data.define(:key, :time, :value)

    SEGMENT_GLOB = "[0-9][0-9][0-9][0-9][0-9][0-9].log"
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
      Dir.mkdir(dir) unless Dir.exist?(dir)

      if writable
        take_lock
        repair_tail
        open_active_segment
      end
    end

    # ---- writing ----

    def append(key, time, value)
      raise "log is read-only" unless @writable

      payload = "#{key}\t#{Integer(time)}\t#{value}"
      line = format("%08x\t%s\n", Zlib.crc32(payload), payload)
      rotate if @active.size + line.bytesize > @max_segment_bytes && @active.size.positive?
      @active.write(line)
      @active.flush
      @active.fsync if @fsync # survive a power cut, not just a crash
      @offsets[@active.path] = @active.size
    end

    # ---- reading ----

    def segments
      Dir.glob(File.join(@dir, SEGMENT_GLOB)).sort
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

            yield parse!(line, path)
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
      crc, payload = line.chomp.split("\t", 2)
      !payload.nil? && crc == format("%08x", Zlib.crc32(payload))
    end

    def parse!(line, path)
      raise Corrupt, "bad checksum in #{File.basename(path)}" unless valid?(line)

      _crc, key, time, value = line.chomp.split("\t")
      Record.new(key: key, time: Integer(time), value: parse_number(value))
    end

    def parse_number(text)
      text.match?(/\A-?\d+\z/) ? Integer(text) : Float(text)
    end

    def open_active_segment
      path = segments.last || segment_path(1)
      @active = File.open(path, "ab")
    end

    def rotate
      number = Integer(File.basename(@active.path, ".log"), 10) + 1
      @active.close
      @active = File.open(segment_path(number), "ab")
    end

    def segment_path(number)
      File.join(@dir, format("%06d.log", number))
    end
  end
end
