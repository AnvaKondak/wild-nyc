namespace :species do
  desc "Load species from the app's src/content/species.json"
  task sync: :environment do
    Species.sync_from_json!
    puts "#{Species.count} species"
  end
end
