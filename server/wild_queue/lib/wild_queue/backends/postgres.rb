# frozen_string_literal: true

require "json"
require "pg"
require "time"

module WildQueue
  module Backends
    # Jobs in a Postgres table. Same calls as Backends::Memory.
    #
    # Give each worker its own backend (its own connection): a PG::Connection must
    # not be shared between threads.
    #
    # See docs/design/010-postgres-skip-locked.md.
    class Postgres
      SCHEMA = <<~SQL
        CREATE TABLE IF NOT EXISTS wild_queue_jobs (
          id           bigserial PRIMARY KEY,
          queue        text        NOT NULL,
          job_class    text        NOT NULL,
          args         jsonb       NOT NULL DEFAULT '{}',
          state        text        NOT NULL DEFAULT 'ready'
                                   CHECK (state IN ('ready', 'running', 'done', 'dead')),
          attempts     integer     NOT NULL DEFAULT 0,
          run_at       timestamptz NOT NULL,
          locked_by    text,
          locked_until timestamptz,
          last_error   text,
          unique_key   text,
          created_at   timestamptz NOT NULL DEFAULT now(),
          updated_at   timestamptz NOT NULL DEFAULT now()
        );

        -- What claim searches: due jobs per queue, oldest first.
        CREATE INDEX IF NOT EXISTS wild_queue_jobs_ready
          ON wild_queue_jobs (queue, run_at, id) WHERE state = 'ready';

        -- Running jobs, to find expired leases.
        CREATE INDEX IF NOT EXISTS wild_queue_jobs_leases
          ON wild_queue_jobs (queue, locked_until) WHERE state = 'running';

        -- At most one waiting-or-running job per unique key.
        CREATE UNIQUE INDEX IF NOT EXISTS wild_queue_jobs_unique_pending
          ON wild_queue_jobs (unique_key)
          WHERE unique_key IS NOT NULL AND state IN ('ready', 'running');

        CREATE TABLE IF NOT EXISTS wild_queue_slots (
          key        text PRIMARY KEY,
          claimed_at timestamptz NOT NULL DEFAULT now()
        );
      SQL

      def self.create_tables!(conn)
        conn.exec(SCHEMA)
      end

      def initialize(conn)
        @conn = conn
        @conn.exec("SET TIME ZONE 'UTC'") # timestamps come back as "... +00"
      end

      def push(attrs)
        loop do
          row = first(<<~SQL, [attrs[:queue], attrs[:job_class], JSON.generate(attrs[:args]), time(attrs[:run_at]), attrs[:unique_key]])
            INSERT INTO wild_queue_jobs (queue, job_class, args, run_at, unique_key)
            VALUES ($1, $2, $3, $4, $5)
            ON CONFLICT (unique_key) WHERE unique_key IS NOT NULL AND state IN ('ready', 'running')
            DO NOTHING
            RETURNING *
          SQL
          return record(row) if row

          # A pending job with this key already exists: hand that one back. If it
          # finished in the instant between the two statements, insert again.
          existing = first(<<~SQL, [attrs[:unique_key]])
            SELECT * FROM wild_queue_jobs
            WHERE unique_key = $1 AND state IN ('ready', 'running')
          SQL
          return record(existing) if existing
        end
      end

      # One statement does the whole claim:
      #   - the inner SELECT finds the next due job and locks its row;
      #   - SKIP LOCKED makes other workers pass over rows already locked, instead
      #     of waiting for them, so two workers never get the same job;
      #   - the UPDATE marks it running and starts the lease.
      def claim(queues:, worker:, now:, lease:)
        row = first(<<~SQL, [worker, time(now + lease), encode_array(queues), time(now)])
          UPDATE wild_queue_jobs
          SET state = 'running', attempts = attempts + 1,
              locked_by = $1, locked_until = $2, updated_at = now()
          WHERE id = (
            SELECT id FROM wild_queue_jobs
            WHERE queue = ANY($3::text[])
              AND ((state = 'ready' AND run_at <= $4)
                OR (state = 'running' AND locked_until <= $4))
            ORDER BY run_at, id
            LIMIT 1
            FOR UPDATE SKIP LOCKED
          )
          RETURNING *
        SQL
        row && record(row)
      end

      def complete(id)
        update(id, "state = 'done', locked_by = NULL, locked_until = NULL")
      end

      def retry_later(id, error:, run_at:)
        update(id, "state = 'ready', run_at = $2, last_error = $3, locked_by = NULL, locked_until = NULL",
               [time(run_at), error])
      end

      def bury(id, error:)
        update(id, "state = 'dead', last_error = $2, locked_by = NULL, locked_until = NULL", [error])
      end

      def revive(id, now:)
        update(id, "state = 'ready', attempts = 0, run_at = $2, last_error = NULL", [time(now)])
      end

      def prune(before:)
        @conn.exec_params("DELETE FROM wild_queue_jobs WHERE state = 'done' AND run_at < $1", [time(before)]).cmd_tuples
      end

      def claim_slot(key)
        @conn.exec_params("INSERT INTO wild_queue_slots (key) VALUES ($1) ON CONFLICT DO NOTHING", [key]).cmd_tuples == 1
      end

      def find(id)
        row = first("SELECT * FROM wild_queue_jobs WHERE id = $1", [id])
        row && record(row)
      end

      def dead
        @conn.exec("SELECT * FROM wild_queue_jobs WHERE state = 'dead' ORDER BY id").map { |r| record(r) }
      end

      def counts
        @conn.exec("SELECT state, count(*) AS n FROM wild_queue_jobs GROUP BY state")
             .to_h { |r| [r["state"], Integer(r["n"])] }
      end

      private

      def update(id, set_clause, params = [])
        @conn.exec_params("UPDATE wild_queue_jobs SET #{set_clause}, updated_at = now() WHERE id = $1", [id, *params])
      end

      def first(sql, params)
        @conn.exec_params(sql, params).first
      end

      # Rows come back as strings; turn one into a Record.
      def record(row)
        Record.new(
          id: Integer(row["id"]),
          queue: row["queue"],
          job_class: row["job_class"],
          args: JSON.parse(row["args"]),
          state: row["state"],
          attempts: Integer(row["attempts"]),
          run_at: parse_time(row["run_at"]),
          locked_by: row["locked_by"],
          locked_until: parse_time(row["locked_until"]),
          last_error: row["last_error"],
          unique_key: row["unique_key"]
        )
      end

      # Times go in as ISO 8601 with microseconds and a UTC offset, so nothing
      # depends on the database's or the machine's time zone.
      def time(t) = t.utc.strftime("%Y-%m-%d %H:%M:%S.%6N+00")

      def parse_time(text) = text && Time.parse(text)

      def encode_array(values)
        PG::TextEncoder::Array.new.encode(values)
      end
    end
  end
end
