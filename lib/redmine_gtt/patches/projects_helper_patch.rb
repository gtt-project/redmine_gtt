module RedmineGtt
  module Patches

    # does not really patch the projects_helper, but extends it's
    # project_settings_tabs method to render the GTT tab
    #
    # TODO move to projects_controller_patch once that's refactored
    module ProjectsHelperPatch

      def self.apply
        ProjectsController.class_eval do
          helper SettingsMenuItem
        end
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
