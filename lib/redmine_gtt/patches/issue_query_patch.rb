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

      # weiter: use 'On map' option tag to hold current map extent
      # - wenn filter hinzugefügt befüllen (dom hook oder so?)
      # - on map move / zoom updaten (app.map.js)
      def initialize_available_filters()
        super
        if project and project.module_enabled?('gtt')
          add_available_filter(
            'location_filter',
            name: l(:label_gtt_location_filter),
            type: :list,
            values: ['On map']
          )
        end
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
