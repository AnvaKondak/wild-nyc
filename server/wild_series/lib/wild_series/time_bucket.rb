# frozen_string_literal: true

module WildSeries
  # Rounds timestamps down to the start of their day or week.
  #
  # A "day" here is a calendar date, stored as midnight UTC of that date. Callers
  # convert a local date (like iNaturalist's "observed_on: 2026-10-01") with
  # TimeBucket.day("2026-10-01"). See docs/design/003-days-are-dates.md.
  module TimeBucket
    DAY = 86_400
    WEEK = 7 * DAY

    # 1 Jan 1970 (timestamp 0) was a Thursday. Shifting by 3 days lines weeks up
    # so they start on Monday.
    MONDAY_SHIFT = 3 * DAY

    module_function

    # Start of the bucket containing `time`.
    def floor(time, bucket)
      time = Integer(time)
      case bucket
      when :day then time - (time % DAY)
      when :week then time - ((time + MONDAY_SHIFT) % WEEK)
      else raise ArgumentError, "unknown bucket #{bucket.inspect} (use :day or :week)"
      end
    end

    # "2026-10-01" (or a Date) => midnight UTC of that date, as an Integer.
    def day(date)
      date = Date.iso8601(date) if date.is_a?(String)
      Time.utc(date.year, date.month, date.day).to_i
    end

    # Integer timestamp => Date (UTC), the inverse of `day`.
    def to_date(time)
      Time.at(Integer(time)).utc.to_date
    end
  end
end
