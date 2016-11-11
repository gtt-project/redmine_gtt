module RedmineGtt
  module Patches

    module UserPatch
      def self.included(base)
        base.extend(ClassMethods)
        base.send(:include, InstanceMethods)
        base.class_eval do
          unloadable
          safe_attributes "geom"
        end
      end

      module ClassMethods
        def get_geojson(user)
          unless user.geom.nil?
            factory = RGeo::GeoJSON::EntityFactory.instance
            wkb = RGeo::WKRep::WKBParser.new(
              :support_ewkb => true,
              :default_srid => 4326
            ).parse(user.geom)
            properties = user.as_json({except: [
              :hashed_password, :hashed_password, :salt, :must_change_passwd,
              :passwd_changed_on, :auth_source_id
            ]})
            RGeo::GeoJSON.encode factory.feature(wkb, user.id, properties)
          else
            nil
          end
        end
      end

      module InstanceMethods
        def geom=(g)
          # Turn geometry attribute into WKB for database use
          if (g.present?)
            geojson = JSON.parse(g)
            feature = RGeo::GeoJSON.decode(geojson, json_parser: :json)

            ewkb = RGeo::WKRep::WKBGenerator.new(
              :type_format => :ewkb,
              :emit_ewkb_srid => true,
              :hex_format => true
            )
            self[:geom] = ewkb.generate(feature.geometry)
          else
            self[:geom] = nil
          end
        end
      end

    end
  end
end

unless User.included_modules.include?(RedmineGtt::Patches::UserPatch)
  User.send(:include, RedmineGtt::Patches::UserPatch)
end
