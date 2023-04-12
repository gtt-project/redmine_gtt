module RedmineGtt
  module Actions
    class UpdateMapLayer < Base

      Result = ImmutableStruct.new(:map_layer_updated?, :map_layer)

      def initialize(map_layer, parameters)
        @ml = map_layer
        @params = parameters
      end

      def call
        @ml.attributes = @params
        Result.new map_layer_updated: @ml.save, map_layer: @ml
      end

    end
  end
end

