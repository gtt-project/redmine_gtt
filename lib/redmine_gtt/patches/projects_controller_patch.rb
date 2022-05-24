module RedmineGtt
  module Patches

    module ProjectsControllerPatch
      def self.apply
        ProjectsController.prepend self unless ProjectsController < self
      end

      # overrides index action to add spatial filtering to projects API listing
      def index
        respond_to do |format|
          format.api {
            retrieve_project_query
            scope = project_scope
            @include_geometry = params[:include] == 'geometry'
            if @include_geometry || params[:contains].present?
              query = RedmineGtt::SpatialProjectsQuery.new(
                contains: params[:contains],
                geometry: @include_geometry,
                projects: scope
              )
              scope = query.scope
              @project_count = query.count
            else
              @project_count = scope.count
            end
            @offset, @limit = api_offset_and_limit
            @projects = scope.offset(@offset).limit(@limit).to_a
          }
          format.any { super }
        end
      end

      def show
        respond_to do |format|
          format.geojson { send_data(
            @project.as_geojson(include_properties: true).to_json,
            type: 'application/json; header=present',
            filename: "#{@project.identifier}.geojson")
          }
          format.any { super }
        end
      end

      # Zeitwerk tweek
      def action_missing(action_name, *args)
        if action_name == 'update_gtt_configuration'
          self.update_gtt_configuration
        end
      end

      def update_gtt_configuration
        if request.put? and User.current.allowed_to?(:manage_gtt_settings, @project)
          @form = GttConfiguration.from_params(params[:gtt_configuration])
          @form.project = @project

          if @form.valid?

            r = RedmineGtt::Actions::UpdateProjectSettings.( @form )
            if r.settings_saved?
              flash.now[:notice] = l(:notice_successful_update)
            else
              flash.now[:error] = l(:error_unable_to_update_project_gtt_settings, "#{r.error}")
            end

          end
          settings
          params[:tab] = 'gtt'
          render action: 'settings'
        else
          redirect_to project_settings_path(@project, tab: 'gtt')
        end
      end

    end
  end
end

