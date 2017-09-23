module RedmineGtt
  module Patches

    module UserPatch
      def self.apply
        unless User < self
          User.prepend GeojsonAttribute
          User.prepend self
          User.class_eval do
            safe_attributes "geom"
          end
        end
      end

      def geojson_additional_properties
        as_json except: %i(
          hashed_password hashed_password salt must_change_passwd
          passwd_changed_on auth_source_id geom
        )
      end

    end
  end
end

