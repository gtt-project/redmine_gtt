module RedmineGtt
  module Patches

    # adds wkb/geojson conversion logic to the class it's included in
    module GeojsonAttribute

      def geojson_additional_properties
        as_json except: [:geom]
      end

      def geojson
        if geom.present?
          Conversions.wkb_to_json(
            geom, id: id, properties: geojson_additional_properties
          )
        end
      end

      def geom=(geometry)
        if (geometry.present?)
          self[:geom] = Conversions.to_wkb geometry
        else
          self[:geom] = nil
        end
      end

    end
  end
end
