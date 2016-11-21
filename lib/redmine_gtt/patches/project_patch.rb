module RedmineGtt
  module Patches

    module ProjectPatch
      def self.included(base)
        base.extend(ClassMethods)
        base.send(:include, InstanceMethods)
        base.class_eval do
          unloadable
          safe_attributes "geom"
        end
      end

      module ClassMethods
      end

      module InstanceMethods
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
end

unless Project.included_modules.include?(RedmineGtt::Patches::ProjectPatch)
  Project.send(:include, RedmineGtt::Patches::ProjectPatch)
end
