module RedmineGtt
  module Patches

    module IssuesControllerPatch
      def self.apply
        IssuesController.prepend self unless IssuesController < self
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
            # patched. (The previous @issue.class_eval relied on ActiveSupport
            # delegating Kernel#class_eval to the singleton class, which is
            # easy to misread as patching the Issue class globally.)
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

