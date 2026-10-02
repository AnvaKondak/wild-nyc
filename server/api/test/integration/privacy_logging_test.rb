require "test_helper"

class PrivacyLoggingTest < ActionDispatch::IntegrationTest
  test "request logs never include the client's IP" do
    io = StringIO.new
    original = Rails.logger
    Rails.logger = ActiveSupport::Logger.new(io)
    begin
      get "/up", headers: { "REMOTE_ADDR" => "203.0.113.7" }
    ensure
      Rails.logger = original
    end
    assert_includes io.string, 'Started GET "/up"'
    refute_includes io.string, "203.0.113.7"
  end
end
