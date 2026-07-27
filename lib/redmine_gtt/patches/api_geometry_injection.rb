module RedmineGtt
  module Patches
    # Adds the plugin's geometry fields to core's REST API responses by
    # post-processing the rendered body, instead of shadowing core's whole
    # *.api.rsb templates.
    #
    # The old approach shipped a full copy of each core api.rsb (issues,
    # projects, users x index/show) with a few extra lines for `geojson`
    # (and `rotation`/`distance`). Those copies silently drifted from core on
    # every Redmine upgrade: the users/show copy, for instance, had lost
    # core's `&& !User.current.authorized_by_oauth?` guard on the API key.
    #
    # This concern never lists core's fields, so it cannot fall behind. Core
    # renders its own template untouched; we only append our own fields to the
    # resource object(s) afterwards. The historic value shapes are preserved:
    # geojson is a parsed object for ?format=json and a JSON string otherwise
    # (including xml), and the key is always present (null when the record has
    # no geometry).
    module ApiGeometryInjection
      private

      # True when the current response is a REST API json/xml body we can edit
      # (not the dedicated .geojson format, nor HTML).
      #
      # init.rb registers :geojson as an alias of application/json, so
      # request.format.json? is also true for .geojson requests; exclude that
      # format explicitly so we never reparse the FeatureCollection body the
      # controllers send_data for it.
      def gtt_api_response?
        return false if request.format.to_sym == :geojson

        request.format.json? || request.format.xml?
      end

      # The geojson field value, matching the previous templates: a parsed
      # object for ?format=json, a JSON string otherwise; nil (rendered as
      # null / an empty element) when the record has no geometry.
      #
      # Gate on geom (as the old templates did), not on record.geojson being
      # nil: in the index path record.geojson is read from a ST_AsGeoJson
      # column and can be a Feature with a null geometry rather than nil.
      def gtt_geojson_value(record)
        return nil unless record.geom.present?

        params[:format] == 'json' ? record.geojson : record.geojson.to_json
      end

      # Merge per-record field hashes into the rendered resource object(s).
      # `extra_by_id` maps integer record id => Hash of fields (symbol keys).
      # `singular`/`plural` are the JSON keys / XML element names.
      def gtt_inject_api_fields(singular, plural, extra_by_id)
        return unless gtt_api_response? && extra_by_id.present?

        if request.format.json?
          gtt_inject_json_fields(singular, plural, extra_by_id)
        else
          gtt_inject_xml_fields(singular, plural, extra_by_id)
        end
      rescue => e
        # Never let injection turn an otherwise valid core response into an
        # error (e.g. a JSONP-wrapped body that does not parse as plain JSON).
        Rails.logger.error("[GTT] REST API geometry injection failed: #{e.class}: #{e.message}")
      end

      def gtt_inject_json_fields(singular, plural, extra_by_id)
        data = JSON.parse(response.body)
        records =
          if data.is_a?(Hash) && data[singular].is_a?(Hash)
            [data[singular]]
          elsif data.is_a?(Hash) && data[plural].is_a?(Array)
            data[plural]
          else
            []
          end

        records.each do |object|
          fields = extra_by_id[object['id']]
          object.merge!(fields.stringify_keys) if fields
        end

        response.body = data.to_json
      end

      def gtt_inject_xml_fields(singular, plural, extra_by_id)
        doc = Nokogiri::XML(response.body)
        root = doc.root
        return unless root

        elements =
          if root.name == singular
            [root]
          elsif root.name == plural
            root.xpath("./#{singular}")
          else
            []
          end

        elements.each do |element|
          id = element.at_xpath('./id')&.text
          next if id.nil?

          fields = extra_by_id[id.to_i]
          next unless fields

          fields.each do |key, value|
            node = Nokogiri::XML::Node.new(key.to_s, doc)
            node.content = value.nil? ? nil : value.to_s
            element.add_child(node)
          end
        end

        response.body = doc.to_xml
      end
    end
  end
end
