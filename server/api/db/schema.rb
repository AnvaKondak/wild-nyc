# This file is auto-generated from the current state of the database. Instead
# of editing this file, please use the migrations feature of Active Record to
# incrementally modify your database, and then regenerate this schema definition.
#
# This file is the source Rails uses to define your schema when running `bin/rails
# db:schema:load`. When creating a new database, `bin/rails db:schema:load` tends to
# be faster and is potentially less error prone than running all of your
# migrations from scratch. Old migrations may fail to apply correctly if those
# migrations use external dependencies or application code.
#
# It's strongly recommended that you check this file into your version control system.

ActiveRecord::Schema[8.1].define(version: 2026_10_02_000003) do
  # These are extensions that must be enabled in order to support this database
  enable_extension "pg_catalog.plpgsql"

  create_table "cells", primary_key: "geohash", id: { type: :string, limit: 6 }, force: :cascade do |t|
    t.datetime "last_requested_at", null: false
    t.datetime "inat_fetched_at"
    t.datetime "ebird_fetched_at"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["last_requested_at"], name: "index_cells_on_last_requested_at"
  end

  create_table "species", id: :string, force: :cascade do |t|
    t.string "friendly_name", null: false
    t.string "common_name", null: false
    t.string "scientific_name", null: false
    t.integer "inat_taxon_id", null: false
    t.integer "inat_exclude_taxon_id"
    t.string "ebird_code"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["ebird_code"], name: "index_species_on_ebird_code", unique: true
    t.index ["inat_taxon_id"], name: "index_species_on_inat_taxon_id"
  end

  create_table "wild_queue_jobs", force: :cascade do |t|
    t.text "queue", null: false
    t.text "job_class", null: false
    t.jsonb "args", default: {}, null: false
    t.text "state", default: "ready", null: false
    t.integer "attempts", default: 0, null: false
    t.timestamptz "run_at", null: false
    t.text "locked_by"
    t.timestamptz "locked_until"
    t.text "last_error"
    t.text "unique_key"
    t.timestamptz "created_at", default: -> { "now()" }, null: false
    t.timestamptz "updated_at", default: -> { "now()" }, null: false
    t.index ["queue", "locked_until"], name: "wild_queue_jobs_leases", where: "(state = 'running'::text)"
    t.index ["queue", "run_at", "id"], name: "wild_queue_jobs_ready", where: "(state = 'ready'::text)"
    t.index ["unique_key"], name: "wild_queue_jobs_unique_pending", unique: true, where: "((unique_key IS NOT NULL) AND (state = ANY (ARRAY['ready'::text, 'running'::text])))"
    t.check_constraint "state = ANY (ARRAY['ready'::text, 'running'::text, 'done'::text, 'dead'::text])", name: "wild_queue_jobs_state_check"
  end

  create_table "wild_queue_slots", primary_key: "key", id: :text, force: :cascade do |t|
    t.timestamptz "claimed_at", default: -> { "now()" }, null: false
  end
end
