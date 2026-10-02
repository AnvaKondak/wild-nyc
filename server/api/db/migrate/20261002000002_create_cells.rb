class CreateCells < ActiveRecord::Migration[8.1]
  def change
    # Neighborhood cells someone has asked about. Only the geohash-6 cell and when:
    # no user, device or IP is ever stored with it.
    create_table :cells, id: false do |t|
      t.string :geohash, limit: 6, null: false, primary_key: true
      t.datetime :last_requested_at, null: false
      t.datetime :inat_fetched_at
      t.datetime :ebird_fetched_at
      t.timestamps
    end
    add_index :cells, :last_requested_at
  end
end
