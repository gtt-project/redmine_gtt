module RedmineGtt
  module Patches

    module ProjectPatch

      def self.apply
        unless Project < self
          Project.prepend self
          Project.prepend GeojsonAttribute
          Project.class_eval do
            safe_attributes "geom"
            has_and_belongs_to_many :gtt_tile_sources
            after_create :set_default_tile_sources
          end
        end
      end

      def map
        GttMap.new json: geojson, layers: gtt_tile_sources
      end

      def enabled_module_names=(*_)
        super
        set_default_tile_sources
      end

      def set_default_tile_sources
        if gtt_tile_sources.none? and module_enabled?(:gtt)
          self.gtt_tile_sources = GttTileSource.default.to_a
        end
      end
      private :set_default_tile_sources

    end

  end
end

