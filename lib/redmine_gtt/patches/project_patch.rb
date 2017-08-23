module RedmineGtt
  module Patches

    module ProjectPatch
      def self.apply
        unless Project < self
          Project.prepend self
          Project.class_eval do
            safe_attributes "geom"
            has_and_belongs_to_many :gtt_tile_sources
          end
        end
      end

      def geojson
        unless self.geom.nil?
          factory = RGeo::GeoJSON::EntityFactory.instance
          wkb = RGeo::WKRep::WKBParser.new(
            :support_ewkb => true,
            :default_srid => 4326
          ).parse(self.geom)
          properties = self.as_json({except: [ :geom ]})
          RGeo::GeoJSON.encode factory.feature(wkb, self.id, properties)
        else
          nil
        end
      end

      def geom=(g)
        # Turn geometry attribute into WKB for database use
        if (g.present?)
          geojson = JSON.parse(g)
          feature = RGeo::GeoJSON.decode(geojson, json_parser: :json)

          ewkb = RGeo::WKRep::WKBGenerator.new(
            :type_format => :ewkb,
            :emit_ewkb_srid => true,
            :hex_format => true
          )
          self[:geom] = ewkb.generate(feature.geometry)
        else
          self[:geom] = nil
        end
      end

    end
  end
end

