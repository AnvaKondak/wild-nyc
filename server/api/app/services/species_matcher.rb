# Maps an iNaturalist observation's taxon (with its ancestors) to one of our species.
# A subspecies (domestic pigeon) matches its species through its ancestors. A group
# like moths matches Lepidoptera unless the taxon is also a butterfly.
class SpeciesMatcher
  def initialize(species = Species.all.to_a)
    # Most specific first, so a Monarch is a Monarch, not "moths" (it's excluded
    # anyway, but order makes the intent explicit).
    @species = species.sort_by { |s| s.inat_exclude_taxon_id ? 1 : 0 }
  end

  def taxon_ids = @species.map(&:inat_taxon_id).uniq

  def match(taxon_ids)
    @species.find do |s|
      taxon_ids.include?(s.inat_taxon_id) && !(s.inat_exclude_taxon_id && taxon_ids.include?(s.inat_exclude_taxon_id))
    end
  end
end
