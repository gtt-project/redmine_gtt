module RedmineGtt
  module Patches
    # this module extends an issue so it's visible_custom_field_values include
    # an additional value representing the geometry.
    #
    # This hack allows the geometry being rendered in the issue PDF variant
    # without having to core-patch Redmine's PDF rendering code.
    module GeometryAsCustomFieldPatch

      class GeometryFieldFormat
        def formatted_custom_value(view, object, html)
          object.value
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

      class GeomtryCustomFieldValue < ::CustomFieldValue
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
          values << GeomtryCustomFieldValue.new(self)
        end
      end
    end
  end
end
