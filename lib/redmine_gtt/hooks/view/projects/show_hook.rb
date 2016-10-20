module RedmineGtt
  module Hooks
    class ViewProjectsShowHook < Redmine::Hook::ViewListener
      def view_projects_show_left(context = {})
      end

      def view_projects_show_right(context = {})
        section = [];
        # section << content_tag(:h3, l(:label_user_map))

        section << tag(:div, :data => {
          :lon => Setting.plugin_redmine_gtt['default_map_center_longitude'],
          :lat => Setting.plugin_redmine_gtt['default_map_center_latitude'],
          :zoom => Setting.plugin_redmine_gtt['default_map_zoom_level'],
          :geom => context[:project].geom,
          :type => 'POLYGON'
        }, :id => 'olmap', :class => 'map')

        return section.join("\n")
      end
    end
  end
end
