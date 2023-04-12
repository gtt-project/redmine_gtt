# Plugin's routes
# See: http://guides.rubyonrails.org/routing.html

resources :gtt_map_layers
put 'projects/:id/settings/gtt',
  to: 'projects#update_gtt_configuration',
  as: :update_gtt_configuration

scope 'gtt' do
  get 'settings', to: 'gtt_configuration#default_setting_configuration', as: :default_setting_configuration
end
