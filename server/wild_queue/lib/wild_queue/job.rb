# frozen_string_literal: true

module WildQueue
  # Mix this into a class to make it a job:
  #
  #   class FetchCell
  #     include WildQueue::Job
  #     def perform(cell:) = ...
  #   end
  #
  # Arguments must survive a trip through JSON (strings, numbers, booleans, nil,
  # arrays, hashes), because jobs are stored, not kept as Ruby objects.
  module Job
    # Only classes that include Job can be run. A stored job naming any other class
    # is refused, so data in the queue can never make us instantiate arbitrary code.
    @registry = {}

    class << self
      attr_reader :registry

      def included(base)
        registry[base.name] = base
        base.extend(ClassMethods)
      end

      def lookup(name)
        registry.fetch(name) { raise UnknownJob, "no job class named #{name.inspect}" }
      end
    end

    module ClassMethods
      # Per-class settings with defaults:
      #   queue_name "fetch"
      #   max_attempts 8
      def queue_name(name = nil)
        name ? (@queue_name = name.to_s) : (@queue_name || "default")
      end

      def max_attempts(n = nil)
        n ? (@max_attempts = Integer(n)) : (@max_attempts || 5)
      end
    end
  end

  class UnknownJob < StandardError; end
end
