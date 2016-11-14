module RedmineGtt
  module Patches

    module IssuesHelperPatch
      def self.included(base)
        base.extend(ClassMethods)
        base.send(:include, InstanceMethods)
        base.class_eval do
          unloadable
        end
      end

      module ClassMethods
        def get_geojson(issues)
          unless issues.nil?
            factory = RGeo::GeoJSON::EntityFactory.instance
            features = []
            issues.each do |issue|
              wkb = RGeo::WKRep::WKBParser.new(
                :support_ewkb => true,
                :default_srid => 4326
              ).parse(issue.geom)
              features << factory.feature(wkb, issue.id, issue.as_json)
            end
            RGeo::GeoJSON.encode factory.feature_collection(features)
          else
            nil
          end
        end
      end

      module InstanceMethods
      end

    end
  end
end

unless IssuesHelper.included_modules.include?(RedmineGtt::Patches::IssuesHelperPatch)
  IssuesHelper.send(:include, RedmineGtt::Patches::IssuesHelperPatch)
end