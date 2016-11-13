module RedmineGtt
  module Hooks
    class ViewIssuesIndexBottomHook < Redmine::Hook::ViewListener
      def view_issues_index_bottom(context={})
        return '' if context[:project].nil?
        return '' unless User.current.allowed_to?(:view_issues, context[:project])

        section = [];
        section << content_tag(:legend, l(:field_location),
          :onclick => 'toggleFieldset(this);')

        section << tag(:div, :data => {
          # TODO: Don't know where to extend "Issues"
          :geom => IssuesHelper.get_geojson(context[:issues]),
          :bounds => context[:project].geojson
        }, :id => 'olmap', :class => 'ol-map')

        # TODO: Try not to use html_safe
        return content_tag(:fieldset, section.join("\n").html_safe,
          :id => 'location',
          :class => 'collapsible')
      end
    end
  end
end
