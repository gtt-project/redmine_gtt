module RedmineGtt
  module Patches

    module IssuePatch

      def self.apply
        unless Issue < self
          Issue.prepend self
          Issue.prepend GeojsonAttribute
          Issue.class_eval do
            safe_attributes "geojson",
              if: ->(issue, user){
                perm = issue.new_record? ? :add_issues : :edit_issues
                user.allowed_to? perm, issue.project
              }
          end
        end
      end

      def map
        GttMap.new json: geojson, layers: project.gtt_tile_sources,
          bounds: (new_record? ? project.map.json : geojson(simple: true))
      end

    end

  end
end

