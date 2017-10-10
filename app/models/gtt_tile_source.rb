# Tile source model
#
# Configuration is stored as json
class GttTileSource < ActiveRecord::Base
  self.inheritance_column = 'none'

  validates :name, presence: true
  validates :type, presence: true
  validate :take_json_options

  acts_as_positioned
  scope :sorted, ->{ order :position }

  # globally available tile sources
  scope :global, ->{ where global: true }

  # default tile sources for new projects
  scope :default, ->{ where default: true }

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

