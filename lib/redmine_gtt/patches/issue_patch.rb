module RedmineGtt
  module Patches

    module IssuePatch

      def self.apply
        unless Issue < self
          Issue.prepend self
          Issue.prepend GeojsonAttribute
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

    end

  end
end

