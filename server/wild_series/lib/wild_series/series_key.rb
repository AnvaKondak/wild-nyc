# frozen_string_literal: true

module WildSeries
  # Names one series by its tags, e.g. { cell: "dr5rke", species: "rock-pigeon" }.
  #
  # Tags are turned into one canonical string, sorted by tag name, so the same tags
  # always give the same key no matter what order they were written in:
  #
  #   SeriesKey.new(species: "rock-pigeon", cell: "dr5rke").to_s
  #   # => "cell=dr5rke,species=rock-pigeon"
  class SeriesKey
    # Tag names and values can't contain the characters we use as separators.
    VALID = /\A[a-z0-9_\-.]+\z/i

    attr_reader :tags

    def self.parse(string)
      tags = string.split(",").to_h { |pair| pair.split("=", 2) }
      new(tags)
    end

    def initialize(tags)
      raise ArgumentError, "a series needs at least one tag" if tags.empty?

      @tags = tags.to_h { |name, value| [name.to_s, value.to_s] }.sort.to_h.freeze
      @tags.each do |name, value|
        unless name.match?(VALID) && value.match?(VALID)
          raise ArgumentError, "invalid tag #{name}=#{value}"
        end
      end
      @string = @tags.map { |name, value| "#{name}=#{value}" }.join(",").freeze
    end

    def to_s = @string

    # True if every tag in `filter` is also on this key with the same value.
    # An empty filter matches everything.
    def matches?(filter)
      filter.all? { |name, value| @tags[name.to_s] == value.to_s }
    end

    def ==(other) = other.is_a?(SeriesKey) && other.to_s == to_s
    alias eql? ==

    def hash = @string.hash
  end
end
