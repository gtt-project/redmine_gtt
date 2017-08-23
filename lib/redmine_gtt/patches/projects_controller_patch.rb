module RedmineGtt
  module Patches

    module ProjectsControllerPatch
      def self.included(base)
        base.extend(ClassMethods)
        base.send(:include, InstanceMethods)
        base.class_eval do
          unloadable
          # skip_before_filter :check_if_login_required
          # skip_before_filter :verify_authenticity_token
          # accept_api_auth :show_with_geojson
          # accept_rss_auth :show_with_geojson
          alias_method_chain :show, :geojson

        end
      end

      module ClassMethods
      end

      module InstanceMethods
        def show_with_geojson
          respond_to do |format|
            format.geojson { send_data(
              @project.geojson.to_json,
              :type => 'application/json; header=present',
              :filename => "#{@project.identifier}.geojson")
            }
            format.any { show_without_geojson }
          end
        end

        def update_gtt_configuration
          if request.put? and User.current.allowed_to?(:manage_gtt_settings, @project)
            r = RedmineGtt::Actions::UpdateProjectSettings.(
              @project, gtt_configuration_params
            )
            if r.settings_saved?
              flash.now[:notice] = l(:notice_successful_update)
            else
              flash.now[:error] = r.error
            end
            settings
            params[:tab] = 'gtt'
            render action: 'settings'
          else
            redirect_to project_settings_path(@project, tab: 'gtt')
          end
        end

        private

        def gtt_configuration_params
          params[:gtt_configuration].permit gtt_tile_source_ids: []
        end

      end

    end
  end
end

unless ProjectsController.included_modules.include?(RedmineGtt::Patches::ProjectsControllerPatch)
  ProjectsController.send(:include, RedmineGtt::Patches::ProjectsControllerPatch)
end
