# frozen_string_literal: true

module RedmineGtt
  # Converts between meters and the display unit configured in the plugin
  # settings (#10). Meters are the internal unit everywhere: storage, SQL,
  # the filter wire format and the REST API all stay metric; only what the
  # user sees and types is converted.
  module DistanceUnit

    METERS_PER_UNIT = {
      'm'  => 1.0,
      'km' => 1000.0,
      'ft' => 0.3048,
      'mi' => 1609.344,
      'nm' => 1852.0
    }.freeze

    DEFAULT = 'm'

    # Units the REST API may use. Reserved for future flexibility: the API
    # contract is meters and only meters for now, but the setting exists so
    # a later version can widen this list without a settings migration.
    API_UNITS = %w(m).freeze

    # The configured display unit, falling back to meters for anything
    # unknown (empty setting, typo from a manually edited setting hash).
    def self.current
      unit = Setting.plugin_redmine_gtt['distance_unit'].to_s
      METERS_PER_UNIT.key?(unit) ? unit : DEFAULT
    end

    # The unit used by the REST API. Clamped to meters regardless of the
    # stored value while API_UNITS has a single entry.
    def self.api_unit
      unit = Setting.plugin_redmine_gtt['api_distance_unit'].to_s
      API_UNITS.include?(unit) ? unit : DEFAULT
    end

    def self.from_meters(meters, unit = current)
      meters.to_f / METERS_PER_UNIT.fetch(unit)
    end

    def self.to_meters(value, unit = current)
      value.to_f * METERS_PER_UNIT.fetch(unit)
    end

  end
end
