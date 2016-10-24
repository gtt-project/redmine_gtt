# require 'rgeo/geo_json'
module RedmineGtt
  module Hooks
    class ViewIssuesIndexBottomHook < Redmine::Hook::ViewListener
      def view_issues_index_bottom(context={})
        return '' if context[:project].nil?
        return '' unless User.current.allowed_to?(:view_issues, context[:project])

        # if !context[:project].geometry.blank?
        #   # TODO:error handling
        #   project_geom = RGeo::GeoJSON.decode(context[:project].geom, :json_parser => :json)
        #   extent_json = RGeo::GeoJSON.encode(project_geom).to_json
        #   inner_section << content_tag(:span, extent_json, :class => 'extent')
        # end

        section = [];
        section << content_tag(:legend, l(:field_location),
          :onclick => 'toggleFieldset(this);')

        section << tag(:div, :data => {
          :lon => Setting.plugin_redmine_gtt['default_map_center_longitude'],
          :lat => Setting.plugin_redmine_gtt['default_map_center_latitude'],
          :zoom => Setting.plugin_redmine_gtt['default_map_zoom_level'],
          :bounds => context[:project].geom,
        }, :id => 'olmap', :class => 'map')

        context[:issues].each do |issue|
          section << content_tag(:span, issue.geom, :data => {
            :target => issue.id,
            :status => issue.status,
            :subject => issue.subject,
            :tracker => issue.tracker,
            :priority => issue.priority
          }, :href => "/issues/#{issue.id}", :class => 'geojson')
        end

        # TODO: Try not to use html_safe
        return content_tag(:fieldset, section.join("\n").html_safe,
          :id => 'location',
          :class => 'collapsible')
      end
    end
  end
end
