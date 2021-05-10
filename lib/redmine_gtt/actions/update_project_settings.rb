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
        if tile_source_ids = @form.gtt_tile_source_ids
          @project.gtt_tile_source_ids = tile_source_ids
        end

        begin
          @project.geojson = @form.geojson
        rescue RGeo::Error::InvalidGeometry => e
          @project.errors.add(:geom, :invalid)
          return false
        end

        @project.save
      end

    end
  end
end
