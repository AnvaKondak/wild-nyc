# Privacy: request paths contain the neighborhood cell (/v1/neighborhoods/dr5rke).
# Rails normally logs `Started GET "/v1/neighborhoods/dr5rke" for 203.0.113.7`,
# which would tie a person's IP to their neighborhood. Log the request without it.
module NoIpInRequestLog
  private

  def started_request_message(request)
    format('Started %s "%s" at %s', request.raw_request_method, request.filtered_path, Time.now.utc.iso8601)
  end
end

Rails::Rack::Logger.prepend(NoIpInRequestLog)
