Rails.application.routes.draw do
  # Health check for load balancers and uptime monitors.
  get "up" => "rails/health#show", as: :rails_health_check

  namespace :v1 do
    get "neighborhoods/:cell", to: "neighborhoods#show", as: :neighborhood, format: false, constraints: { cell: %r{[^/]+} }
    match "neighborhoods/:cell", to: "neighborhoods#preflight", via: :options, format: false, constraints: { cell: %r{[^/]+} }
  end
end
