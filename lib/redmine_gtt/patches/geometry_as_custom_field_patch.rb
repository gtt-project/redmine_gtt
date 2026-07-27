module RedmineGtt
  module Patches
    # this module extends an issue so it's visible_custom_field_values include
    # an additional value representing the geometry.
    #
    # This hack allows the geometry being rendered in the issue PDF variant
    # without having to core-patch Redmine's PDF rendering code.
    module GeometryAsCustomFieldPatch

      class GeometryFieldFormat
        # Must return a UTF-8 String: for non-String values Redmine's
        # format_object recurses and queries CustomField methods the fake
        # GeometryCustomField does not implement (e.g. thousands_delimiter?
        # since Redmine 6.1), and RGeo's WKT comes back US-ASCII encoded,
        # which the CommonMark pipeline behind the PDF export rejects.
        # Either made PDF export fail with a 500 for issues with geometry.
        def formatted_custom_value(view, object, html)
          # Round the WKT for display; the stored geometry keeps full precision.
          RedmineGtt.round_wkt(object.value.to_s).encode(Encoding::UTF_8)
        end
      end

      class GeometryCustomField
        attr_reader :format, :name
        def initialize
          @format = GeometryFieldFormat.new
          @name = I18n.t :field_geom
        end
        def full_width_layout?
          true
        end
        def full_text_formatting?
          false
        end
      end

      class GeometryCustomFieldValue < ::CustomFieldValue
        attr_reader :custom_field

        def initialize(customized)
          @customized = customized
          @custom_field = GeometryCustomField.new
        end
        def value
          @customized.geom
        end
      end

      def visible_custom_field_values
        super.tap do |values|
          values << GeometryCustomFieldValue.new(self)
        end
      end
    end
  end
end
