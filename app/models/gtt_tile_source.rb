# Tile source model
#
# Configuration is stored as json, this can be extended to support
# tile sources other than ol.source.OSM
class GttTileSource < ActiveRecord::Base
  validates :name, presence: true
  validates :type, inclusion: { in: ->(r){ GttTileSource.types } }

  store_accessor :options, :attributions

  class << self

    def types
      @types || []
    end

    # Add a new tile source implementation
    def add(class_name)
      @types ||= []
      @types << class_name
    end

    def new_for_type(type)
      if types.include? type
        type.new
      else
        GttOsmTileSource.new
      end
    end

  end

end


