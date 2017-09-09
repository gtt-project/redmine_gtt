module RedmineGtt
  module Actions
    class UpdateProjectSettings < Base

      Result = ImmutableStruct.new(:settings_saved?, :error)

      def initialize(project, params)
        @project = project
        @parameters = params.symbolize_keys
      end

      def call
        if tile_source_ids = @parameters.delete(:gtt_tile_source_ids)
          @project.gtt_tile_source_ids = tile_source_ids
        end
        Result.new settings_saved: true
      end
    end
  end
end
