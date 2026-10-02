# Enqueues wild_queue jobs from inside Rails, on ActiveRecord's own connection, so an
# enqueue inside a transaction commits or rolls back with it.
module JobQueue
  def self.enqueue(job_class, args = {}, **options)
    conn = ActiveRecord::Base.connection.raw_connection
    WildQueue::Queue.new(WildQueue::Backends::Postgres.new(conn)).enqueue(job_class, args, **options)
  end

  # Fetch everything we know about for a cell's block. Unique keys stop duplicates
  # while a fetch is waiting or running.
  def self.fetch_cell(geohash)
    enqueue(FetchInatCell, { cell: geohash }, unique_key: "inat:#{geohash}")
    enqueue(FetchEbirdCell, { cell: geohash }, unique_key: "ebird:#{geohash}") if EbirdClient.configured?
  end
end
