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
      # RGeo's GeoJSON encoder emits full float precision and offers no
      # rounding option (see gtt-project/redmine_gtt#7), so coordinates are
      # rounded after encoding. Defaults to the configured plugin precision.
      def initialize(precision: RedmineGtt.geojson_precision)
        @factory = RGeo::GeoJSON::EntityFactory.instance
        @precision = precision
      end

      def to_json(object, id: nil, properties: nil)
        round_coordinates RGeo::GeoJSON.encode(feature(object, id, properties))
      end

      def collection_to_json(data)
        round_coordinates RGeo::GeoJSON.encode(@factory.feature_collection(
          data.map{|object, id, properties| feature(object, id, properties)}
        ))
      end

      private

      def feature(object, id, properties = nil)
        @factory.feature object, id, (properties || {})
      end

      # Walks the encoded GeoJSON and rounds the numbers under any
      # "coordinates" key to @precision decimal places, leaving everything
      # else (notably "properties") untouched.
      def round_coordinates(node)
        case node
        when Hash
          node.each_with_object({}) do |(key, value), result|
            result[key] = key == 'coordinates' ? round_numbers(value) : round_coordinates(value)
          end
        when Array
          node.map { |element| round_coordinates(element) }
        else
          node
        end
      end

      def round_numbers(value)
        case value
        when Array then value.map { |element| round_numbers(element) }
        when Numeric then value.round(@precision)
        else value
        end
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

    # Turn a geometry attribute into an Rgeo object for database use. The input
    # may be a GeoJSON String or an already-parsed GeoJSON object (a Hash, or
    # the ActionController::Parameters a JSON API request delivers).
    def self.to_geom(geometry)
      RGeo::GeoJSON.decode(
        coerce_geojson(geometry),
        json_parser: :json,
        geo_factory: RGeo::Cartesian.preferred_factory(has_z_coordinate: true, srid: 4326)
      ).geometry
    end

    # Turn a geometry attribute into WKB for database use. Accepts the same
    # String or already-parsed object as .to_geom.
    def self.to_wkb(geometry)
      feature = RGeo::GeoJSON.decode(coerce_geojson(geometry), json_parser: :json)
      ewkb = RGeo::WKRep::WKBGenerator.new(
        type_format: :ewkb,
        emit_ewkb_srid: true,
        hex_format: true
      )
      ewkb.generate feature.geometry
    rescue JSON::ParserError
      # The geometry is likely already in WKB format
      geometry
    end

    # Accept a GeoJSON String or an already-parsed object. A nested object
    # previously reached JSON.parse(Hash) and raised a TypeError (surfacing as
    # HTTP 500 on the REST API); both forms now decode. Mirrors the String
    # guard already used in .to_feature.
    def self.coerce_geojson(geometry)
      return JSON.parse(geometry) if geometry.is_a?(String)
      return geometry.to_unsafe_h if geometry.respond_to?(:to_unsafe_h)

      geometry
    end

  end
end
