module RedmineGtt
  module Patches

    module ProjectsControllerPatch
      include ApiGeometryInjection

      def self.apply
        return if ProjectsController < self

        ProjectsController.prepend self
        # Inject geojson (when geometry is requested) and rotation into core's
        # rendered REST API response instead of shadowing projects/*.api.rsb.
        ProjectsController.after_action :gtt_inject_project_geometry, only: %i[show index]
      end

      def gtt_inject_project_geometry
        return unless gtt_api_response?

        if action_name == 'show' && @project
          gtt_inject_api_fields('project', 'projects',
            @project.id => { geojson: gtt_geojson_value(@project), rotation: @project.map_rotation })
        elsif action_name == 'index' && @projects
          extra = @projects.each_with_object({}) do |project, hash|
            fields = { rotation: project.map_rotation }
            fields[:geojson] = gtt_geojson_value(project) if @include_geometry
            hash[project.id] = fields
          end
          gtt_inject_api_fields('project', 'projects', extra)
        end
      end

      # overrides index action to add spatial filtering to projects API listing
      def index
        respond_to do |format|
          format.api {
            retrieve_project_query
            scope = project_scope
            @include_geometry = include_in_api_response?('geometry')
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

