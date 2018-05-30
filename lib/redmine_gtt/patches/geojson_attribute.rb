module RedmineGtt
  module Patches

    # adds wkb/geojson conversion logic to the class it's included in
    module GeojsonAttribute

      def self.prepended(base)
        base.extend ClassMethods
        base.class_eval do
          # if this wouldnt break count, this would be really nice:
          #default_scope ->{ select "#{table_name}.*, ST_AsGeoJson(#{table_name}.geom) as geojson" }
          scope :geojson, ->(include_properties: false){
            data = []
            where.not(geom: nil).
              select("#{table_name}.*, #{geojson_attribute_select}").
              find_each{|o|
                data << o.geojson_params(include_properties)
              }
            Conversions::GeomToJson.new.collection_to_json data
          }
        end
      end

      module ClassMethods

        def geojson_attribute_select
          "ST_AsGeoJson(#{table_name}.geom) as db_geojson"
        end

        def array_to_geojson(array, include_properties: false)
          Conversions::GeomToJson.new.collection_to_json(
            array.map{ |o|
              o.geojson_params(include_properties) if o.geom
            }.compact
          )
        end
      end

      def geojson_additional_properties(include_properties = false)
        case include_properties
        when Hash
          if only = include_properties[:only]
            as_json only: only
          else
            except = include_properties[:except] || []
            except << :geom
            as_json except: except
          end
        when TrueClass
          as_json except: [:geom]
        else
          {}
        end
      end

      # returns the geojson attribute for reading / writing to the DB
      def geojson
        @geojson ||= if respond_to?(:db_geojson) && db_geojson.present?
                       # use the value returned by ST_AsGeoJson
                       Conversions.to_feature db_geojson
                     elsif geom.present?
                       Conversions.geom_to_json geom
                     end
      end

      # sets the geojson attribute for reading / writing to the DB
      def geojson=(geometry)
        @geojson = geometry
        if (geometry.present?)
          self.geom = Conversions.to_geom geometry
        else
          self.geom = nil
        end
      end

      # returns a GeoJSON representation of this record.
      #
      # Use include_properties: true to include all of the record's properties
      # use include_properties: { only: [ :id, :subject ] } for a specific
      # subset of properties
      #
      # Use this method and not #geojson for rendering maps
      def as_geojson(include_properties: false)
        return geojson unless include_properties

        if geom.present?
          Conversions.geom_to_json(
            geom,
            id: id,
            properties: geojson_additional_properties(include_properties)
          )
        end
      end

      def geojson_params(include_properties)
        [ geom, id, geojson_additional_properties(include_properties) ]
      end

    end
  end
end
