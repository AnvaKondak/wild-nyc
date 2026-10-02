class CreateSpecies < ActiveRecord::Migration[8.1]
  def change
    # One row per species (or group, like moths) in the app's species.json.
    create_table :species, id: :string do |t| # "rock-pigeon"
      t.string :friendly_name, null: false
      t.string :common_name, null: false
      t.string :scientific_name, null: false
      t.integer :inat_taxon_id, null: false
      t.integer :inat_exclude_taxon_id # for groups: count the parent taxon minus this one
      t.string :ebird_code # birds only
      t.timestamps
    end
    add_index :species, :inat_taxon_id
    add_index :species, :ebird_code, unique: true
  end
end
