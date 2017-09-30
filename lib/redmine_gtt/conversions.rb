module RedmineGtt

  # for some reason these conversions are not reversible, i.e. when I try to
  # convert from json to wkb and back to json I get
  #
  # RGeo::Error::ParseError: Bad endian byte value: 123
  #
  # It appears to work when the wkb gets written to / read from database in
  # between.
  module Conversions

    class WkbToJson
      def initialize()
        @factory = RGeo::GeoJSON::EntityFactory.instance
        @parser = RGeo::WKRep::WKBParser.new(
          support_ewkb: true,
          default_srid: 4326
        )
      end

      def to_json(wkb, id: nil, properties: nil)
        RGeo::GeoJSON.encode feature(wkb, id, properties)
      end

      def collection_to_json(data)
        RGeo::GeoJSON.encode @factory.feature_collection(
          data.map{|wkb, id, props| feature wkb, id, props}
        )
      end

      private

      def feature(wkb, id, properties = nil)
        @factory.feature @parser.parse(wkb), id, (properties || {})
      end

    end

    # Turns database WKB into geometry attribute string
    def self.wkb_to_json(wkb, id: nil, properties: nil)
      WkbToJson.new.to_json(wkb, id: id, properties: properties)
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
