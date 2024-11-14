# Map layer model
#
# Configuration is stored as json
class GttMapLayer < (defined?(ApplicationRecord) == 'constant' ? ApplicationRecord : ActiveRecord::Base)
  self.inheritance_column = 'none'

  validates :name, presence: true
  validates :layer, presence: true

  validate :take_json_layer_options
  validate :take_json_source_options
  validate :take_json_format_options

  acts_as_positioned
  scope :sorted, ->{ order :position }

  # globally available map layers
  scope :global, ->{ where global: true }

  # default map layers for new projects
  scope :default, ->{ where default: true }

  attr_writer :layer_options_string
  def layer_options_string
    @layer_options_string ||= JSON.pretty_generate(layer_options || {})
  end

  attr_writer :source_options_string
  def source_options_string
    @source_options_string ||= JSON.pretty_generate(source_options || {})
  end

  attr_writer :format_options_string
  def format_options_string
    @format_options_string ||= JSON.pretty_generate(format_options || {})
  end

  private

  def take_json_layer_options
    self.layer_options = JSON.parse(layer_options_string)
  rescue JSON::ParserError
    errors.add :layer_options_string, I18n.t(:error_invalid_json)
  end

  def take_json_source_options
    self.source_options = JSON.parse(source_options_string)
  rescue JSON::ParserError
    errors.add :source_options_string, I18n.t(:error_invalid_json)
  end

  def take_json_format_options
    self.format_options = JSON.parse(format_options_string)
  rescue JSON::ParserError
    errors.add :format_options_string, I18n.t(:error_invalid_json)
  end

end

