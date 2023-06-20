class GttController < ApplicationController
  def map
    path = Rails.root.join('public', 'plugin_assets', 'redmine_gtt', 'javascripts', 'main.js.map')
    send_file path, type: 'application/json', disposition: 'inline'
  end
end
