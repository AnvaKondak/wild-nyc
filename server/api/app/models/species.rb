class Species < ApplicationRecord
  self.table_name = "species"

  # Loads (or updates) every species from the app's bundled species.json, so the
  # app and the server always agree on ids and taxa.
  def self.sync_from_json!(path = Rails.configuration.x.species_json)
    rows = JSON.parse(File.read(path))
    transaction do
      rows.each do |row|
        species = find_or_initialize_by(id: row.fetch("id"))
        species.update!(
          friendly_name: row.fetch("friendlyName"),
          common_name: row.fetch("commonName"),
          scientific_name: row.fetch("scientificName"),
          inat_taxon_id: row.fetch("iNatTaxonId"),
          inat_exclude_taxon_id: row["iNatExcludeTaxonId"],
          ebird_code: row["ebirdCode"]
        )
      end
      where.not(id: rows.map { |r| r["id"] }).delete_all
    end
  end

  def self.by_ebird_code
    where.not(ebird_code: nil).index_by(&:ebird_code)
  end
end
