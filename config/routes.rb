# Plugin's routes
# See: http://guides.rubyonrails.org/routing.html

resources :gtt_tile_sources
put 'projects/:id/settings/gtt',
  to: 'projects#update_gtt_configuration',
  as: :update_gtt_configuration
