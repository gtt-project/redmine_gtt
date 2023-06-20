module RedmineGtt
  module Patches

    module UserPatch
      def self.apply
        unless User < self
          User.prepend GeojsonAttribute
          User.prepend self
          User.class_eval do
            safe_attributes "geojson"
          end
        end
      end

      def map
        GttMap.new json: as_geojson, layers: GttMapLayer.global.sorted
      end

      def geojson_additional_properties(include_properties)
        default_except = %i(
          hashed_password hashed_password salt must_change_passwd
          passwd_changed_on auth_source_id
        )

        case include_properties
        when Hash
          if except = include_properties[:except]
            return super except: (except + default_except)
          end
        when TrueClass
          return super except: default_except
        end

        super
      end

    end
  end
end

