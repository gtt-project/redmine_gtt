module RedmineGtt
  module Patches

    module ProjectPatch

      def self.apply
        unless Project < self
          Project.prepend GeojsonAttribute
          Project.prepend self
          Project.class_eval do
            safe_attributes :geojson, :map_rotation
            has_and_belongs_to_many :gtt_map_layers
            after_create :set_default_map_layers
          end
        end
      end

      def map
        GttMap.new json: as_geojson, layers: gtt_map_layers.sorted
      end

      def enabled_module_names=(*_)
        super
        set_default_map_layers
      end

      def set_default_map_layers
        if gtt_map_layers.none? and module_enabled?(:gtt)
          self.gtt_map_layers = GttMapLayer.default.sorted.to_a
        end
      end
      private :set_default_map_layers

    end

  end
end
