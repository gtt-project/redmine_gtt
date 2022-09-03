module RedmineGtt
  module Patches

    # does not really patch the projects_helper, but extends it's
    # project_settings_tabs method to render the GTT tab
    #
    # TODO move to projects_controller_patch once that's refactored
    module ProjectsHelperPatch

      def self.apply
        ProjectsHelper.prepend self unless ProjectsHelper < self
        ProjectsController.class_eval do
          helper SettingsMenuItem
        end
      end

      def render_api_includes(project, api)
        super
        api.array :layers do
          project.gtt_tile_sources.each do |gtt_tile_source|
            api.layer(
              :id => gtt_tile_source.id,
              :name => gtt_tile_source.name,
              :type => gtt_tile_source.type,
              :options => gtt_tile_source.options,
              :global => gtt_tile_source.global,
              :default => gtt_tile_source.default,
              :position => gtt_tile_source.position,
              :baselayer => gtt_tile_source.baselayer
            )
          end
        end if include_in_api_response?('layers')
      end

      module SettingsMenuItem
        def project_settings_tabs
          super.tap do |tabs|
            if User.current.allowed_to?(:manage_gtt_settings, @project)
              tabs << {
                name: 'gtt',
                action: :manage_gtt_settings,
                partial: 'projects/settings/gtt',
                label: :label_gtt_settings
              }
            end
          end
        end
      end

    end
  end
end
