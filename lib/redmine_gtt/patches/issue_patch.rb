require 'rgeo'
require 'rgeo/geo_json'
require_dependency 'issue'

module RedmineGtt
  module Patches

    module IssuePatch
      def self.included(base)
        base.class_eval do
          unloadable
          safe_attributes "geom" if lambda {|issue, user| user.allowed_to?(:edit_issues, issue.project) }
          before_save :geojson_to_ewkb
        end
      end

      def geojson_to_ewkb
        if (self.geom.present?)
          geojson = JSON.parse(self.geom)
          feature = RGeo::GeoJSON.decode(geojson, json_parser: :json)

          ewkb = RGeo::WKRep::WKBGenerator.new(
            :type_format => :ewkb,
            :emit_ewkb_srid => true,
            :hex_format => true
          )
          self.geom = ewkb.generate(feature.geometry)
        else
          self.geom = nil;
        end
      end

    end

  end
end

unless Issue.included_modules.include?(RedmineGtt::Patches::IssuePatch)
  Issue.send(:include, RedmineGtt::Patches::IssuePatch)
end
