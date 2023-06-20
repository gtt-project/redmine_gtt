module RedmineGtt
  module Actions
    class UpdateProjectSettings < Base

      Result = ImmutableStruct.new(:settings_saved?, :error)

      def initialize(form)
        @form = form
        @project = form.project
      end

      def call
        @project.transaction do
          if update_project
            Result.new settings_saved: true
          else
            Result.new settings_saved: false,
                       error: @project.errors.full_messages
          end
        end
      end

      private

      def update_project
        if map_layer_ids = @form.gtt_map_layer_ids
          @project.gtt_map_layer_ids = map_layer_ids
        end

        begin
          @project.geojson = @form.geojson
          @project.map_rotation = @form.map_rotation
        rescue RGeo::Error::InvalidGeometry => e
          @project.errors.add(:geom, :invalid)
          return false
        end

        @project.save
      end

    end
  end
end
