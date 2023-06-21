module RedmineGtt

  # for some reason these conversions are not reversible, i.e. when I try to
  # convert from json to wkb and back to json I get
  #
  # RGeo::Error::ParseError: Bad endian byte value: 123
  #
  # It appears to work when the wkb gets written to / read from database in
  # between.
  module Conversions

    class GeomToJson
      def initialize()
        @factory = RGeo::GeoJSON::EntityFactory.instance
      end

      def to_json(object, id: nil, properties: nil)
        RGeo::GeoJSON.encode feature(object, id, properties)
      end

      def collection_to_json(data)
        RGeo::GeoJSON.encode @factory.feature_collection(
          data.map{|object, id, properties| feature(object, id, properties)}
        )
      end

      private

      def feature(object, id, properties = nil)
        @factory.feature object, id, (properties || {})
      end
    end

    class WkbToGeom
      def initialize()
        @parser = RGeo::WKRep::WKBParser.new(
          support_ewkb: true,
          default_srid: 4326
        )
      end

      def self.call(wkb)
        new.call wkb
      end

      def call(wkb)
        @parser.parse(wkb)
      end
    end

    def self.to_feature(geometry, properties: {})
      geometry = JSON.parse geometry if geometry.is_a?(String)
      {
        'type' => 'Feature',
        'geometry' => geometry,
        'properties' => properties
      }
    end

    # Turns database WKB into geometry attribute string
    def self.wkb_to_json(wkb, id: nil, properties: nil)
      geom_to_json WkbToGeom.(wkb), id: id, properties: properties
    end

    # turns Rgeo object into GeoJSON
    def self.geom_to_json(object, id: nil, properties: nil)
      GeomToJson.new.to_json(object, id: id, properties: properties)
    end

    # Turn geometry attribute string (GeoJSON) into Rgeo object for database
    # use
    def self.to_geom(geometry)
      geojson = JSON.parse(geometry)
      RGeo::GeoJSON.decode(
        geojson,
        json_parser: :json,
        geo_factory: RGeo::Cartesian.preferred_factory(has_z_coordinate: true, srid: 4326)
      ).geometry
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
