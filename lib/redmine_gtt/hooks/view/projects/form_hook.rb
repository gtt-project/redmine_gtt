module RedmineGtt
  module Hooks
    class ViewProjectsFormHook < Redmine::Hook::ViewListener
      def view_projects_form(context = {})
        section = [];
        section << context[:form].hidden_field(:geom,
          :value => context[:project].geom,
          :readonly => true)

        section << tag(:div, :data => {
          :lon => Setting.plugin_redmine_gtt['default_map_center_longitude'],
          :lat => Setting.plugin_redmine_gtt['default_map_center_latitude'],
          :zoom => Setting.plugin_redmine_gtt['default_map_zoom_level'],
          :geom => context[:project].geom,
          :edit => 'Polygon'
        }, :id => 'olmap', :class => 'map')

        return section.join("\n")
      end
    end
  end
end
