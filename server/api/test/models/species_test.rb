require "test_helper"

class SpeciesTest < ActiveSupport::TestCase
  test "syncs every species from the app's JSON" do
    Species.sync_from_json!
    app = JSON.parse(File.read(Rails.configuration.x.species_json))
    assert_equal app.size, Species.count
    gull = Species.find("herring-gull")
    assert_equal 1578489, gull.inat_taxon_id
    assert_equal "amhgul1", gull.ebird_code
    assert_nil Species.find("raccoon").ebird_code
  end

  test "sync removes species no longer in the JSON" do
    Species.create!(id: "dodo", friendly_name: "Dodos", common_name: "Dodo", scientific_name: "Raphus cucullatus", inat_taxon_id: 1)
    Species.sync_from_json!
    assert_nil Species.find_by(id: "dodo")
  end
end
