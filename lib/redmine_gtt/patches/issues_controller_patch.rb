module RedmineGtt
  module Patches

    module IssuesControllerPatch
      def self.apply
        IssuesController.prepend self unless IssuesController < self
      end

      def show
        respond_to do |format|
          format.geojson { send_data(
            @issue.geojson.to_json,
            :type => 'application/json; header=present',
            :filename => "#{@issue.id}.geojson")
          }
          format.any { super }
        end
      end


      def index
        retrieve_query

        if @query.valid?
          respond_to do |format|
            format.geojson {
              send_data(
                # TODO move that method somewhere else:
                IssuesHelper.get_geojson(@issues).to_json,
                :type => 'application/json; header=present',
                :filename => "issues.geojson")
            }
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

