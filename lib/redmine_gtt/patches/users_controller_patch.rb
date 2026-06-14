module RedmineGtt
  module Patches

    module UsersControllerPatch
      include ApiGeometryInjection

      def self.apply
        return if UsersController < self

        UsersController.prepend self
        # Inject geojson into core's rendered REST API response instead of
        # shadowing users/index|show.api.rsb (whose stale copy had also lost
        # core's OAuth guard on the api_key field).
        UsersController.after_action :gtt_inject_user_geometry, only: %i[show index]
      end

      def gtt_inject_user_geometry
        return unless gtt_api_response?

        if action_name == 'show' && @user
          gtt_inject_api_fields('user', 'users',
            @user.id => { geojson: gtt_geojson_value(@user) })
        elsif action_name == 'index' && @users
          extra = @users.each_with_object({}) do |user, hash|
            hash[user.id] = { geojson: gtt_geojson_value(user) }
          end
          gtt_inject_api_fields('user', 'users', extra)
        end
      end

      def show
        respond_to do |format|
          format.geojson { send_data(
            @user.as_geojson(include_properties: true).to_json,
            :type => 'application/json; header=present',
            :filename => "#{@user.login}.geojson")
          }
          format.any { super }
        end
      end
    end

  end
end

