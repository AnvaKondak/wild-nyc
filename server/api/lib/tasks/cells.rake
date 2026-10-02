namespace :cells do
  desc "Queue fetches for the neighborhoods bundled in the app (src/content/places.json)"
  task warm: :environment do
    places = JSON.parse(File.read(Rails.root.join("..", "..", "src", "content", "places.json"))).fetch("places")
    places.each do |place|
      geohash = Geohash.encode(place["lat"], place["lng"])
      Cell.touch_requested!(geohash)
      JobQueue.fetch_cell(geohash)
    end
    puts "queued #{places.size} neighborhoods"
  end
end
