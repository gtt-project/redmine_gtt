module RedmineGtt
  module Patches

    module IssuePatch

      def self.apply
        unless Issue < self
          Issue.prepend self
          Issue.prepend GeojsonAttribute
          Issue.extend ClassMethods
          Issue.class_eval do
            attr_reader :distance
            safe_attributes "geojson",
              if: ->(issue, user){
                perm = issue.new_record? ? :add_issues : :edit_issues
                user.allowed_to? perm, issue.project
              }

          end
        end
      end

      def map
        json = as_geojson
        GttMap.new json: json, layers: project.gtt_tile_sources.sorted,
          bounds: (new_record? ? project.map.json : json)
      end

      module ClassMethods
        def load_geojson(issues)
          if issues.any?
            geometries_by_id = Hash[
              Issue.
              where(id: issues.map(&:id)).
              pluck(:id, Arel.sql(Issue.geojson_attribute_select))
            ]
            issues.each do |issue|
              issue.instance_variable_set(
                "@geojson", Conversions.to_feature(geometries_by_id[issue.id])
              )
            end
          end
        end
      end

    end

  end
end

