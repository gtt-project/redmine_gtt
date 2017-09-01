module RedmineGtt
  module Actions
    class CreateTileSource < Base

      Result = ImmutableStruct.new(:tile_source_created?, :tile_source)

      def initialize(parameters)
        @params = parameters
      end

      def call
        ts = GttTileSource.new @params
        Result.new tile_source_created: ts.save, tile_source: ts
      end

    end
  end
end
