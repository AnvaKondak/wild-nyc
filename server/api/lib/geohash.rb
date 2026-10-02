# Geohash, the same encoding as the app's src/lib/geohash.ts.
# Precision 6 (about 1.2 × 0.6 km) is a "neighborhood cell".
module Geohash
  BASE32 = "0123456789bcdefghjkmnpqrstuvwxyz"
  CELL_FORMAT = /\A[0-9b-hjkmnp-z]{6}\z/

  Bounds = Data.define(:south, :west, :north, :east) do
    def center = [(south + north) / 2.0, (west + east) / 2.0]
  end

  module_function

  def encode(lat, lng, precision = 6)
    lat_range = [-90.0, 90.0]
    lng_range = [-180.0, 180.0]
    hash = +""
    bits = 0
    value = 0
    even = true # bits alternate: longitude, latitude, longitude, ...

    while hash.length < precision
      range, coord = even ? [lng_range, lng] : [lat_range, lat]
      mid = (range[0] + range[1]) / 2
      if coord >= mid
        value = (value << 1) | 1
        range[0] = mid
      else
        value <<= 1
        range[1] = mid
      end
      even = !even
      bits += 1
      next unless bits == 5

      hash << BASE32[value]
      bits = 0
      value = 0
    end
    hash
  end

  def bounds(hash)
    lat_range = [-90.0, 90.0]
    lng_range = [-180.0, 180.0]
    even = true
    hash.each_char do |char|
      value = BASE32.index(char) or raise ArgumentError, "invalid geohash character #{char.inspect}"
      4.downto(0) do |bit|
        range = even ? lng_range : lat_range
        mid = (range[0] + range[1]) / 2
        value[bit] == 1 ? range[0] = mid : range[1] = mid
        even = !even
      end
    end
    Bounds.new(south: lat_range[0], west: lng_range[0], north: lat_range[1], east: lng_range[1])
  end

  # The cell and its 8 neighbors: a ~3.6 × 1.8 km block, still neighborhood-sized.
  # Computed by stepping one cell-width from the center in each direction.
  def block(hash)
    b = bounds(hash)
    lat, lng = b.center
    dlat = b.north - b.south
    dlng = b.east - b.west
    [-1, 0, 1].product([-1, 0, 1]).map { |dy, dx| encode(lat + dy * dlat, lng + dx * dlng, hash.length) }.uniq
  end
end
