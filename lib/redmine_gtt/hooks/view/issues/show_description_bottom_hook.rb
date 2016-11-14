module RedmineGtt
  module Hooks
    class ViewIssuesShowDescriptionBottomHook < Redmine::Hook::ViewListener
      def view_issues_show_description_bottom(context={})
        return '' if context[:issue].project.nil?
        return '' unless User.current.allowed_to?(:view_issues, context[:issue].project)

        content = [];
        content << content_tag(:div, "", :data => {
          :geom => context[:issue].geojson,
          :bounds => context[:project].geojson,
        }, :id => 'ol-' + rand(36**8).to_s(36), :class => 'ol-map')

        return content.join("\n")
      end
    end
  end
end
