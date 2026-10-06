# Privacy: the app sends a neighborhood cell in the URL, and nothing else. Rails'
# request log would pair that cell with the caller's IP address ("Started GET
# /v1/neighborhoods/dr5rke for 203.0.113.7"), so we leave the IP out of the log.
module Rails
  module Rack
    class Logger
      private

      def started_request_message(request)
        format('Started %s "%s" at %s', request.raw_request_method, request.filtered_path, Time.now.to_default_s)
      end
    end
  end
end
