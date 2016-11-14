module RedmineGtt
  module Hooks
    class ViewProjectsShowHook < Redmine::Hook::ViewListener
      def view_projects_show_left(context = {})
      end

      def view_projects_show_right(context = {})
        section = [];
        # section << content_tag(:h3, l(:label_user_map))

        section << tag(:div, :data => {
          :geom => context[:project].geojson,
          :bounds => context[:project].geojson,
        }, :id => 'ol-' + rand(36**8).to_s(36), :class => 'ol-map')

        return section.join("\n")
      end
    end
  end
end
