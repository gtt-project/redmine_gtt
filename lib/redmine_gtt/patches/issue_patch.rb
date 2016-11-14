module RedmineGtt
  module Patches

    module IssuePatch
      def self.included(base)
        base.extend(ClassMethods)
        base.send(:include, InstanceMethods)
        base.class_eval do
          unloadable
          safe_attributes "geom" if lambda {|issue, user| user.allowed_to?(:edit_issues, issue.project)}
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
            RGeo::GeoJSON.encode factory.feature(wkb, self.id, self.as_json)
          else
            nil
          end
        end

        def geom=(g)
          # Turn geometry attribute into WKB for database use
          pp g
          if (g.present?)
            begin
              geojson = JSON.parse(g)
              feature = RGeo::GeoJSON.decode(geojson, json_parser: :json)

              ewkb = RGeo::WKRep::WKBGenerator.new(
                :type_format => :ewkb,
                :emit_ewkb_srid => true,
                :hex_format => true
              )
              self[:geom] = ewkb.generate(feature.geometry)
            rescue
              # The Gemetry is likely to be already in WKB format
              self[:geom] = g
            end
          else
            self[:geom] = nil
          end
        end
      end

    end
  end
end

unless Issue.included_modules.include?(RedmineGtt::Patches::IssuePatch)
  Issue.send(:include, RedmineGtt::Patches::IssuePatch)
end
