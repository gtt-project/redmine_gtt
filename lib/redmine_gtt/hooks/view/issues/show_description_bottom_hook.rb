module RedmineGtt
  module Hooks
    class ViewIssuesShowDescriptionBottomHook < Redmine::Hook::ViewListener
      def view_issues_show_description_bottom(context={})
        return '' if context[:issue].project.nil?
        return '' unless User.current.allowed_to?(:view_issues, context[:issue].project)

        section = [];
        # section << content_tag(:p, content_tag(:strong, l(:field_location)))

        section << tag(:div, :data => {
          :geom => context[:issue].geojson,
          :bounds => context[:project].geojson,
        }, :id => 'olmap', :class => 'ol-map')

        # TODO: Try not to use html_safe
        return content_tag(:div, section.join("\n").html_safe)
      end
    end
  end
end
