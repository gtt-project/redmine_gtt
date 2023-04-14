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
          project.gtt_map_layers.each do |gtt_map_layer|
            api.layer(gtt_map_layer.attributes.except("created_at", "updated_at","position","global"))
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
