module RedmineGtt
  module Actions
    class UpdateTileSource < Base

      Result = ImmutableStruct.new(:tile_source_updated?, :tile_source)

      def initialize(tile_source, parameters)
        @ts = tile_source
        @params = parameters
      end

      def call
        @ts.attributes = @params
        Result.new tile_source_updated: @ts.save, tile_source: @ts
      end

    end
  end
end

