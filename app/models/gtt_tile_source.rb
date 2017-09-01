# Tile source model
#
# Configuration is stored as json, this can be extended to support
# tile sources other than ol.source.OSM
class GttTileSource < ActiveRecord::Base
  self.inheritance_column = 'none'

  validates :name, presence: true
  validates :type, presence: true
  validate :take_json_options

  attr_writer :options_string
  def options_string
    @options_string ||= JSON.pretty_generate(options || {})
  end

  private

  def take_json_options
    self.options = JSON.parse options_string
  rescue JSON::ParserError
    errors.add :options_string, I18n.t(:error_invalid_json)
  end

end

