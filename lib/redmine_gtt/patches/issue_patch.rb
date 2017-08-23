module RedmineGtt
  module Patches

    module IssuePatch

      def self.apply
        Issue.prepend self unless Issue < self
        Issue.class_eval do
          safe_attributes "geom",
            if: ->(issue, user){ user.allowed_to?(:edit_issues, issue.project)}
        end
      end

      def geojson
        unless self.geom.nil?
          factory = RGeo::GeoJSON::EntityFactory.instance
          wkb = RGeo::WKRep::WKBParser.new().parse(self.geom)
          RGeo::GeoJSON.encode factory.feature(wkb, self.id, self.as_json)
        else
          nil
        end
      end

      def geom=(g)
        # Turn geometry attribute into WKB for database use
        if (g.present?)
          begin
            geojson = JSON.parse(g)
            feature = RGeo::GeoJSON.decode(geojson, json_parser: :json)
            wkb = RGeo::WKRep::WKBGenerator.new(
              :hex_format => true
            )
            self[:geom] = wkb.generate(feature.geometry)
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

