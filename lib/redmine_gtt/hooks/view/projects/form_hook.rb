module RedmineGtt
  module Hooks
    class ViewProjectsFormHook < Redmine::Hook::ViewListener
      def view_projects_form(context = {})
        section = [];
        section << context[:form].hidden_field(:geom,
          :value => context[:project].geojson, :id => 'geom')

        section << content_tag(:div, "", :data => {
          :geom => context[:project].geojson,
          :edit => 'Polygon'
        }, :id => 'olmap', :class => 'ol-map')

        return section.join("\n")
      end
    end
  end
end
