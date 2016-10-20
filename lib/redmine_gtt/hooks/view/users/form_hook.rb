module RedmineGtt
  module Hooks
    class ViewUsersFormHook < Redmine::Hook::ViewListener
      def view_users_form(context = {})
        section = [];
        section << context[:form].hidden_field(:geom,
          :value => context[:user].geom,
          :readonly => true)

        section << tag(:div, :data => {
          :lon => Setting.plugin_redmine_gtt['default_map_center_longitude'],
          :lat => Setting.plugin_redmine_gtt['default_map_center_latitude'],
          :zoom => Setting.plugin_redmine_gtt['default_map_zoom_level'],
          :geom => context[:user].geom,
          :type => 'POINT'
        }, :id => 'olmap', :class => 'map')

        return section.join("\n")
      end
    end
  end
end
