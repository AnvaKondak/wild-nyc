module V1
  # GET /v1/neighborhoods/:cell
  #
  # The app sends only a geohash-6 cell. The response is about the cell and its
  # neighbors; nothing about who asked is stored.
  class NeighborhoodsController < ApplicationController
    # NYC + Jersey City, with some margin. Cells outside aren't fetched, which also
    # stops anyone using the API to make us crawl the whole planet.
    SERVICE_AREA = { south: 40.45, north: 40.95, west: -74.30, east: -73.65 }.freeze

    # Lets the web build of the app (a different origin) read responses. The data is
    # public and no cookies are involved, so any origin may read it.
    after_action { response.set_header("Access-Control-Allow-Origin", "*") }

    def show
      cell = params[:cell].to_s.downcase
      return render_error(:unprocessable_content, "not a geohash-6 cell") unless cell.match?(Geohash::CELL_FORMAT)
      return render_error(:not_found, "outside the area we cover (NYC and Jersey City)") unless in_service_area?(cell)

      record = Cell.touch_requested!(cell)
      JobQueue.fetch_cell(cell) unless record.fetched?

      species = SeriesStore.read { |store| NeighborhoodReport.new(cell).species(store) }
      response.set_header("Cache-Control", "private, max-age=600")
      render json: {
        cell: cell,
        status: record.fetched? ? "ready" : "warming_up",
        updatedAt: [record.inat_fetched_at, record.ebird_fetched_at].compact.max&.utc&.iso8601,
        window: { recentDays: NeighborhoodReport::RECENT_DAYS, yearDays: NeighborhoodReport::YEAR_DAYS },
        species: species.map { |s| { id: s.id, recent: s.recent, year: s.year, lastSeenOn: s.last_seen_on.iso8601, weekly: s.weekly } },
        sources: [
          { name: "iNaturalist", url: "https://www.inaturalist.org" },
          ({ name: "eBird", url: "https://ebird.org" } if EbirdClient.configured?),
        ].compact,
      }
    end

    private

    def in_service_area?(cell)
      lat, lng = Geohash.bounds(cell).center
      lat.between?(SERVICE_AREA[:south], SERVICE_AREA[:north]) && lng.between?(SERVICE_AREA[:west], SERVICE_AREA[:east])
    end

    def render_error(status, message)
      render json: { error: message }, status: status
    end
  end
end
