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
        def get_geojson(project)
          unless project.geom.nil?
            factory = RGeo::GeoJSON::EntityFactory.instance
            wkb = RGeo::WKRep::WKBParser.new(
              :support_ewkb => true,
              :default_srid => 4326
            ).parse(project.geom)
            RGeo::GeoJSON.encode factory.feature(wkb, project.id, project.as_json)
          else
            nil
          end
        end
      end

      module InstanceMethods
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
