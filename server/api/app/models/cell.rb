class Cell < ApplicationRecord
  self.primary_key = "geohash"

  validates :geohash, format: { with: Geohash::CELL_FORMAT }

  # Notes that someone asked about this cell. Returns the cell.
  def self.touch_requested!(geohash, now: Time.current)
    upsert({ geohash: geohash, last_requested_at: now, created_at: now, updated_at: now },
           unique_by: :geohash, update_only: [:last_requested_at])
    find(geohash)
  end

  # Cells someone asked about recently: the ones worth keeping fresh.
  scope :active, ->(since: 30.days.ago) { where(last_requested_at: since..) }

  def fetched?
    inat_fetched_at.present? || ebird_fetched_at.present?
  end
end
