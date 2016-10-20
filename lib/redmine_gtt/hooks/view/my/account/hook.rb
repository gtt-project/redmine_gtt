module RedmineGtt
  module Hooks
    class ViewMyAccountHook < Redmine::Hook::ViewListener
      def view_my_account(context = {})
        section = [];
        section << context[:form].hidden_field(:geom)

        section << tag(:div, :data => {
          :lon => Setting.plugin_redmine_gtt['default_map_center_longitude'],
          :lat => Setting.plugin_redmine_gtt['default_map_center_latitude'],
          :zoom => Setting.plugin_redmine_gtt['default_map_zoom_level'],
          :geom => context[:user].geom,
          :type => 'POINT'
        }, :id => 'olmap', :class => 'map')

        return section.join("\n")
      end

      def view_my_account_contextual(context = {})
      end
    end
  end
end
