module RedmineGtt

  # for some reason these conversions are not reversible, i.e. when I try to
  # convert from json to wkb and back to json I get
  #
  # RGeo::Error::ParseError: Bad endian byte value: 123
  #
  # It appears to work when the wkb gets written to / read from database in
  # between.
  module Conversions

    # Turns database WKB into geometry attribute string
    def self.wkb_to_json(wkb, id: nil, properties: {})
      factory = RGeo::GeoJSON::EntityFactory.instance
      geometry = RGeo::WKRep::WKBParser.new(
        support_ewkb: true,
        default_srid: 4326
      ).parse(wkb)
      RGeo::GeoJSON.encode factory.feature(geometry, id, properties)
    end

    # Turn geometry attribute string into WKB for database use
    def self.to_wkb(geometry)
      geojson = JSON.parse(geometry)
      feature = RGeo::GeoJSON.decode(geojson, json_parser: :json)
      ewkb = RGeo::WKRep::WKBGenerator.new(
        type_format: :ewkb,
        emit_ewkb_srid: true,
        hex_format: true
      )
      ewkb.generate feature.geometry
    rescue JSON::ParserError
      # The Gemetry is likely to be already in WKB format
      geometry
    end

  end
end
