module RedmineGtt
  module Actions
    class UpdateTileSource < Base

      Result = ImmutableStruct.new(:tile_source_updated?, :tile_source)

      def initialize(tile_source, parameters)
        @ts = tile_source
        @params = parameters.except(:type)
      end

      def call
        @ts.attributes = @params
        if @ts.save
          Result.new tile_source_updated: true, tile_source: @ts
        else
          Result.new tile_source: @ts
        end
      end

    end
  end
end

