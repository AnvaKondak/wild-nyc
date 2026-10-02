require "net/http"

# The one place that makes outgoing HTTP requests. Returns [status, body].
# Clients take this as a dependency so tests can swap in canned responses.
module HttpGet
  USER_AGENT = "WildNeighbors/0.1 (+https://github.com/; neighborhood-level counts only)"

  def self.call(uri, headers = {})
    request = Net::HTTP::Get.new(uri, { "User-Agent" => USER_AGENT, "Accept" => "application/json" }.merge(headers))
    response = Net::HTTP.start(uri.host, uri.port, use_ssl: uri.scheme == "https", open_timeout: 10, read_timeout: 30) do |http|
      http.request(request)
    end
    [response.code.to_i, response.body]
  end
end
