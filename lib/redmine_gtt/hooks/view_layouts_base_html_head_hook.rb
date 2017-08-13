module RedmineGtt
  module Hooks
    class ViewLayoutsBaseHtmlHeadHook < Redmine::Hook::ViewListener

      include ActionView::Context

      def view_layouts_base_html_head(context={})
        tags = [];
        tags << stylesheet_link_tag("ol.css", :plugin => "redmine_gtt", :media => "all")
        tags << stylesheet_link_tag("ol-control.css", :plugin => "redmine_gtt", :media => "all")
        tags << stylesheet_link_tag("ol3-ext.min.css", :plugin => "redmine_gtt", :media => "all")
        tags << stylesheet_link_tag("fonts.css", :plugin => "redmine_gtt", :media => "all")
        tags << stylesheet_link_tag("app.css", :plugin => "redmine_gtt", :media => "all")
        tags << stylesheet_link_tag("https://cdnjs.cloudflare.com/ajax/libs/font-awesome/4.7.0/css/font-awesome.min.css")

        tags << javascript_include_tag('ol-debug.js', :plugin => 'redmine_gtt')
        tags << javascript_include_tag('ol3-ext.min.js', :plugin => 'redmine_gtt')
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
          :geocoder_url => Setting.plugin_redmine_gtt['default_geocoder_url'],
          :geocoder_apikey => Setting.plugin_redmine_gtt['default_geocoder_apikey']
        }, :id => 'ol-defaults', :style => 'display:none')

        return tags.join("\n")
      end

    end
  end
end
