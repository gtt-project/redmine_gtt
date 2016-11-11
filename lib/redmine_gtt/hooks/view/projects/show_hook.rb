module RedmineGtt
  module Hooks
    class ViewProjectsShowHook < Redmine::Hook::ViewListener
      def view_projects_show_left(context = {})
      end

      def view_projects_show_right(context = {})
        section = [];
        # section << content_tag(:h3, l(:label_user_map))

        section << tag(:div, :data => {
          :geom => Project.get_geojson(context[:project].geom),
          :bounds => Project.get_geojson(context[:project].geom),
        }, :id => 'olmap', :class => 'ol-map')

        return section.join("\n")
      end
    end
  end
end
