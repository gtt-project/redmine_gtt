module RedmineGtt
  module Actions
    class CreateMapLayer < Base

      Result = ImmutableStruct.new(:map_layer_created?, :map_layer)

      def initialize(parameters)
        @params = parameters
      end

      def call
        ml = GttMapLayer.new @params
        Result.new map_layer_created: ml.save, map_layer: ml
      end

    end
  end
end
