module RedmineGtt
  module Hooks
    class ViewAccountHook < Redmine::Hook::ViewListener
      def view_account_left_bottom(context = {})
        section = [];
        section << content_tag(:h3, l(:label_user_map))

        section << tag(:div, :data => {
          :geom => User.get_geojson(context[:user].geom),
        }, :id => 'olmap', :class => 'map')

        return section.join("\n")
      end

      def view_account_right_bottom(context = {})
      end
    end
  end
end
