module RedmineGtt
  module Patches

    module IssuesControllerPatch
      include ApiGeometryInjection

      def self.apply
        return if IssuesController < self

        IssuesController.prepend self
        # Inject geojson (and distance on the index) into core's rendered REST
        # API response instead of shadowing issues/index|show.api.rsb.
        IssuesController.after_action :gtt_inject_issue_geometry, only: %i[show index]
      end

      def gtt_inject_issue_geometry
        return unless gtt_api_response?

        if action_name == 'show' && @issue
          gtt_inject_api_fields('issue', 'issues',
            @issue.id => { geojson: gtt_geojson_value(@issue) })
        elsif action_name == 'index' && @issues
          extra = @issues.each_with_object({}) do |issue, hash|
            fields = { geojson: gtt_geojson_value(issue) }
            fields[:distance] = issue.distance if issue.respond_to?(:distance) && issue.distance
            hash[issue.id] = fields
          end
          gtt_inject_api_fields('issue', 'issues', extra)
        end
      end

      def show
        respond_to do |format|
          format.geojson { send_data(
            @issue.as_geojson(include_properties: true).to_json,
            :type => 'application/json; header=present',
            :filename => "#{@issue.id}.geojson")
          }
          format.pdf {
            # Pretend the geometry is a custom field to have it rendered.
            # Prepend to the singleton class so only this one instance is
            # patched. (The previous @issue.class_eval spelling only worked
            # because ActiveSupport adds a class_eval method to Kernel that
            # delegates to the object's singleton class; plain Ruby defines
            # class_eval on Module only, and it read as if it patched the
            # Issue class globally.)
            @issue.singleton_class.prepend(GeometryAsCustomFieldPatch)
            super
          }
          format.any { super }
        end
      end

      def retrieve_query(*_)
        return @query if @query
        super
      end
      private :retrieve_query

      def index
        retrieve_query

        if @query.valid?
          respond_to do |format|
            format.geojson {
              issues = @query.issues(offset: @offset, limit: @limit)
              send_data(
                Issue.array_to_geojson(issues, include_properties: true).to_json,
                :type => 'application/json; header=present',
                :filename => "issues.geojson"
              )
            }
            format.api { @query.load_geojson; super }
            format.any { super }
          end
        else
          super
        end
      rescue ActiveRecord::RecordNotFound
        render_404
      end

    end
  end
end

