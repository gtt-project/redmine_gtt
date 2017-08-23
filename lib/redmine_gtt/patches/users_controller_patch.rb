module RedmineGtt
  module Patches

    module UsersControllerPatch
      def self.apply
        UsersController.prepend self unless UsersController < self
      end

      def show
        respond_to do |format|
          format.geojson { send_data(
            @user.geojson.to_json,
            :type => 'application/json; header=present',
            :filename => "#{@user.login}.geojson")
          }
          format.any { super }
        end
      end
    end

  end
end

