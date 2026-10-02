# Scheduled every few hours: queue fresh fetches for every cell someone asked about
# in the last 30 days. Unique keys mean a cell that's still being fetched isn't
# queued twice.
class RefreshCells
  include WildQueue::Job

  def perform
    Cell.active.pluck(:geohash).each { |geohash| JobQueue.fetch_cell(geohash) }
  end
end
