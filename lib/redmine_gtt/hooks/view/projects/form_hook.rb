module RedmineGtt
  module Hooks
    class ViewProjectsFormHook < Redmine::Hook::ViewListener
      def view_projects_form(context = {})
        section = [];
        section << context[:form].hidden_field(:geom,
          :value => Project.get_geojson(context[:project]), :id => 'geom')

        section << content_tag(:div, "", :data => {
          :geom => Project.get_geojson(context[:project]),
          :edit => 'Polygon'
        }, :id => 'olmap', :class => 'ol-map')

        return section.join("\n")
      end
    end
  end
end
