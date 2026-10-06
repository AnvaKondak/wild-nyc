# The Wild Neighbors API: Rails (API only) + the two plain-Ruby pieces it's built on
# (wild_series, wild_queue). Build from the repo root, so the image also gets the
# app's species list (src/content/species.json), which the API syncs on start:
#
#   docker build -f server/Dockerfile .
#
# Layout inside the image mirrors the repo, so relative paths keep working:
#   /app/server/api, /app/server/wild_series, /app/server/wild_queue, /app/src/content

ARG RUBY_VERSION=4.0.7
FROM ruby:${RUBY_VERSION}-slim AS base
WORKDIR /app/server/api
ENV RAILS_ENV=production \
    BUNDLE_DEPLOYMENT=1 \
    BUNDLE_PATH=/usr/local/bundle \
    BUNDLE_WITHOUT="development:test"
RUN apt-get update -qq && apt-get install --no-install-recommends -y libpq5 curl && rm -rf /var/lib/apt/lists/*

FROM base AS build
RUN apt-get update -qq && apt-get install --no-install-recommends -y build-essential libpq-dev git libyaml-dev pkg-config && rm -rf /var/lib/apt/lists/*
COPY server/wild_series /app/server/wild_series
COPY server/wild_queue /app/server/wild_queue
COPY server/api/Gemfile server/api/Gemfile.lock ./
RUN bundle install && rm -rf ~/.bundle "${BUNDLE_PATH}"/ruby/*/cache
COPY server/api ./
RUN bundle exec bootsnap precompile --gemfile app/ lib/ 2>/dev/null || true

FROM base
COPY --from=build /usr/local/bundle /usr/local/bundle
COPY --from=build /app/server /app/server
COPY src/content/species.json /app/src/content/species.json
RUN useradd --create-home --shell /bin/bash rails && mkdir -p /data && chown -R rails:rails /app /data
USER rails
EXPOSE 8080
CMD ["bin/start"]
