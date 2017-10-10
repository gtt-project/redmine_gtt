module RedmineGtt
  module Patches
    module IssueQueryPatch

      def self.apply
        unless IssueQuery < self
          IssueQuery.prepend self
          IssueQuery.add_available_column QueryColumn.new(:geom,
                                                          caption: :field_geom)
        end
      end

      def self.prepended(base)
      end

      def available_columns
        super.tap do |columns|
          if project and !project.module_enabled?('gtt')
            columns.reject!{|c| c.name == :geom}
          end
        end
      end
    end
  end
end
