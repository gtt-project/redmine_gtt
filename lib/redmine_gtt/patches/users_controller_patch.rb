module RedmineGtt
  module Patches

    module UsersControllerPatch
      def self.included(base)
        base.extend(ClassMethods)
        base.send(:include, InstanceMethods)
        base.class_eval do
          unloadable
          alias_method_chain :show, :geojson
        end
      end

      module ClassMethods
      end

      module InstanceMethods
        def show_with_geojson
          respond_to do |format|
            format.geojson { send_data(
              @user.geojson.to_json,
              :type => 'application/json; header=present',
              :filename => "#{@user.login}.geojson")
            }
            format.any { show_without_geojson }
          end
        end
      end

    end
  end
end

unless UsersController.included_modules.include?(RedmineGtt::Patches::UsersControllerPatch)
  UsersController.send(:include, RedmineGtt::Patches::UsersControllerPatch)
end
