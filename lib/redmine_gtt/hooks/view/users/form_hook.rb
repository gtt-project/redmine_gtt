module RedmineGtt
  module Hooks
    class ViewUsersFormHook < Redmine::Hook::ViewListener
      def view_users_form(context = {})
        section = [];
        section << context[:form].hidden_field(:geom,
          :value => User.get_geojson(context[:user].geom), :id => 'geom')

        section << tag(:div, :data => {
          :geom => User.get_geojson(context[:user].geom),
          :edit => 'Point'
        }, :id => 'olmap', :class => 'ol-map')

        return section.join("\n")
      end
    end
  end
end
