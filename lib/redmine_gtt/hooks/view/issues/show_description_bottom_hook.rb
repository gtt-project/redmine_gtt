module RedmineGtt
  module Hooks
    class ViewIssuesShowDescriptionBottomHook < Redmine::Hook::ViewListener
      def view_issues_show_description_bottom(context={})
        return '' if context[:issue].project.nil?
        return '' unless User.current.allowed_to?(:view_issues, context[:issue].project)

        # if !context[:project].geometry.blank?
        #   # TODO:error handling
        #   project_geom = RGeo::GeoJSON.decode(context[:project].geom, :json_parser => :json)
        #   extent_json = RGeo::GeoJSON.encode(project_geom).to_json
        #   inner_section << content_tag(:span, extent_json, :class => 'extent')
        # end

        section = [];
        # section << content_tag(:p, content_tag(:strong, l(:field_location)))

        section << tag(:div, :data => {
          :lon => Setting.plugin_redmine_gtt['default_map_center_longitude'],
          :lat => Setting.plugin_redmine_gtt['default_map_center_latitude'],
          :zoom => Setting.plugin_redmine_gtt['default_map_zoom_level'],
          :geom => Issue.get_geojson(context[:issue].geom),
          :bounds => Project.get_geojson(context[:project].geom),
        }, :id => 'olmap', :class => 'map')

        # TODO: Try not to use html_safe
        return content_tag(:div, section.join("\n").html_safe)
      end
    end
  end
end
