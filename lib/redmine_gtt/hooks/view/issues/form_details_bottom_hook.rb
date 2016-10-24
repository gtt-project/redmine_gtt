module RedmineGtt
  module Hooks
    class ViewIssuesFormDetailsBottomHook < Redmine::Hook::ViewListener
      def view_issues_form_details_bottom(context={})
        return '' if context[:issue].nil? || context[:issue].project.nil?
        return '' unless User.current.allowed_to?(:view_issues, context[:issue].project)

        if context[:issue].new_record?
          return '' unless User.current.allowed_to?(:add_issues, context[:issue].project)
        else
          return '' unless User.current.allowed_to?(:edit_issues, context[:issue].project)
        end

        # if !context[:project].geometry.blank?
        #   # TODO:error handling
        #   project_geom = RGeo::GeoJSON.decode(context[:project].geom, :json_parser => :json)
        #   extent_json = RGeo::GeoJSON.encode(project_geom).to_json
        #   inner_section << content_tag(:span, extent_json, :class => 'extent')
        # end

        section = [];
        section << context[:form].hidden_field(:geom,
          :value => context[:issue].geom,
          :readonly => true)

        section << tag(:div, :data => {
          :lon => Setting.plugin_redmine_gtt['default_map_center_longitude'],
          :lat => Setting.plugin_redmine_gtt['default_map_center_latitude'],
          :zoom => Setting.plugin_redmine_gtt['default_map_zoom_level'],
          :geom => context[:issue].geom,
          :bounds => context[:project].geom,
          :edit => 'Point LineString Polygon'
        }, :id => 'olmap', :class => 'map')

        return section.join("\n")
      end
    end
  end
end
