# frozen_string_literal: true

module RedmineGtt
  # Tracker icon setting values: a JSON string {"id": "mdi:home", "svg": "..."}.
  #
  # The id is a stable icon identifier (e.g. an Iconify name) kept for
  # interoperability; the svg is the sanitized markup the map renders.
  # Legacy values (bare glyph names from the icon-font era) pass through
  # unchanged and render as the default marker until re-picked.
  module TrackerIcon
    MAX_ID_LENGTH = 100

    module_function

    # Normalizes a submitted tracker icon setting value, sanitizing the SVG.
    # Returns '' when the value claims to be an icon but contains no usable
    # SVG after sanitization.
    def normalize(value)
      data =
        begin
          JSON.parse(value.to_s)
        rescue JSON::ParserError
          nil
        end
      return value unless data.is_a?(Hash)

      svg = SvgSanitizer.sanitize(data['svg'])
      return '' if svg.nil?

      JSON.generate('id' => data['id'].to_s[0, MAX_ID_LENGTH], 'svg' => svg)
    end
  end
end
