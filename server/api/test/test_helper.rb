ENV["RAILS_ENV"] ||= "test"
require_relative "../config/environment"
require "rails/test_help"

module ActiveSupport
  class TestCase
    # Run tests in parallel with specified workers
    parallelize(workers: :number_of_processors)

    # Setup all fixtures in test/fixtures/*.yml for all tests in alphabetical order.

    # Each test gets a fresh in-memory time-series store as both writer and reader.
    setup do
      @series = WildSeries::Store.new
      SeriesStore.writer = @series
      SeriesStore.reader = @series
      Species.sync_from_json!
    end

    teardown { SeriesStore.reset! }
  end
end

# Stands in for HttpGet: answers from canned bodies and records what was asked.
class FakeHttp
  attr_reader :requests

  def initialize(*responses)
    @responses = responses
    @requests = []
  end

  def call(uri, headers = {})
    @requests << [uri, headers]
    @responses.size > 1 ? @responses.shift : @responses.first
  end
end

NO_WAIT = Throttle.new(0)
