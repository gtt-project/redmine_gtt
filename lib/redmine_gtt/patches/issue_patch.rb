module RedmineGtt
  module Patches

    module IssuePatch

      def self.apply
        unless Issue < self
          Issue.prepend self
          Issue.prepend GeojsonAttribute
          Issue.class_eval do
            safe_attributes "geom",
              if: ->(issue, user){ user.allowed_to?(:edit_issues, issue.project)}
          end
        end
      end

    end

  end
end

