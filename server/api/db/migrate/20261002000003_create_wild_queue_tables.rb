class CreateWildQueueTables < ActiveRecord::Migration[8.1]
  # The queue owns its schema (WildQueue::Backends::Postgres::SCHEMA) so the gem and
  # the app can't drift apart; this migration just runs it.
  def up
    execute WildQueue::Backends::Postgres::SCHEMA
  end

  def down
    drop_table :wild_queue_jobs
    drop_table :wild_queue_slots
  end
end
