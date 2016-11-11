module RedmineGtt
  module Hooks
    class ViewLayoutsBaseHtmlHeadHook < Redmine::Hook::ViewListener
      def view_layouts_base_html_head(context={})
        tags = [];
        tags << stylesheet_link_tag("ol.css", :plugin => "redmine_gtt", :media => "all")
        tags << stylesheet_link_tag("controlbar.css", :plugin => "redmine_gtt", :media => "all")
        tags << stylesheet_link_tag("app.css", :plugin => "redmine_gtt", :media => "all")

        tags << javascript_include_tag('ol-debug.js', :plugin => 'redmine_gtt')
        tags << javascript_include_tag('filter.js', :plugin => 'redmine_gtt')
        tags << javascript_include_tag('maskfilter.js', :plugin => 'redmine_gtt')
        tags << javascript_include_tag('controlbar.js', :plugin => 'redmine_gtt')
        tags << javascript_include_tag('togglecontrol.js', :plugin => 'redmine_gtt')
        tags << javascript_include_tag('app.js', :plugin => 'redmine_gtt')
        tags << javascript_include_tag('app.map.js', :plugin => 'redmine_gtt')
        return tags.join("\n")
      end
      def view_layouts_base_body_bottom(context={})
        tags = [];
        tags << tag(:div, :data => {
          :lon => Setting.plugin_redmine_gtt['default_map_center_longitude'],
          :lat => Setting.plugin_redmine_gtt['default_map_center_latitude'],
          :zoom => Setting.plugin_redmine_gtt['default_map_zoom_level'],
          :maxzoom => Setting.plugin_redmine_gtt['default_map_maxzoom_level'],
        }, :id => 'ol-defaults', :style => 'display:none')
        return tags.join("\n")
      end
    end
  end
end
