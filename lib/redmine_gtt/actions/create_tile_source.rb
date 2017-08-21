module RedmineGtt
  module Actions
    class CreateTileSource < Base

      Result = ImmutableStruct.new(:tile_source_created?, :tile_source)

      def initialize(parameters)
        @params = parameters.dup
      end

      def call
        ts = GttOsmTileSource.new_for_type @params.delete :type
        ts.attributes = @params
        if ts.save
          Result.new tile_source_created: true, tile_source: ts
        else
          Result.new tile_source: ts
        end
      end

    end
  end
end
