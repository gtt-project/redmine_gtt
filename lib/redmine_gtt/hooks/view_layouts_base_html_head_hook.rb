module RedmineGtt
  module Hooks
    class ViewLayoutsBaseHtmlHeadHook < Redmine::Hook::ViewListener

      include ActionView::Context

      def view_layouts_base_html_head(context={})
        tags = [];
        tags << tag(:link, :rel => "preload", :as => "font", :type => "application/vnd.ms-fontobject",
          :href => "/plugin_assets/redmine_gtt/fonts/mcr-icons.eot?75e7536f7f839b0f143e30ad8d0da92d?#iefi", :crossorigin => "anonymous" )
        tags << tag(:link, :rel => "preload", :as => "font", :type => "font/woff2",
          :href => "/plugin_assets/redmine_gtt/fonts/mcr-icons.woff2?75e7536f7f839b0f143e30ad8d0da92d", :crossorigin => "anonymous" )
        tags << tag(:link, :rel => "preload", :as => "font", :type => "font/woff",
          :href => "/plugin_assets/redmine_gtt/fonts/mcr-icons.woff?75e7536f7f839b0f143e30ad8d0da92d", :crossorigin => "anonymous" )
        tags << tag(:link, :rel => "preload", :as => "font", :type => "font/ttf",
          :href => "/plugin_assets/redmine_gtt/fonts/mcr-icons.ttf?75e7536f7f839b0f143e30ad8d0da92d", :crossorigin => "anonymous" )
        tags << tag(:link, :rel => "preload", :as => "font", :type => "image/svg+xml",
          :href => "/plugin_assets/redmine_gtt/fonts/mcr-icons.svg?75e7536f7f839b0f143e30ad8d0da92d#mcr-icons", :crossorigin => "anonymous" )
        tags << tag(:link, :rel => "preload", :as => "font", :type => "application/vnd.ms-fontobject",
          :href => "/plugin_assets/redmine_gtt/fonts/fontmaki.eot?66752613#iefix'", :crossorigin => "anonymous" )
        tags << tag(:link, :rel => "preload", :as => "font", :type => "font/woff",
          :href => "/plugin_assets/redmine_gtt/fonts/fontmaki.woff?66752613", :crossorigin => "anonymous" )
        tags << tag(:link, :rel => "preload", :as => "font", :type => "font/ttf",
          :href => "/plugin_assets/redmine_gtt/fonts/fontmaki.ttf?66752613", :crossorigin => "anonymous" )
        tags << tag(:link, :rel => "preload", :as => "font", :type => "image/svg+xml",
          :href => "/plugin_assets/redmine_gtt/fonts/fontmaki.svg?66752613#fontmaki", :crossorigin => "anonymous" )

        tags << stylesheet_link_tag("https://cdnjs.cloudflare.com/ajax/libs/font-awesome/4.7.0/css/font-awesome.min.css")
        tags << stylesheet_link_tag("fonts.css", :plugin => "redmine_gtt", :media => "all")
        tags << stylesheet_link_tag("ol.css", :plugin => "redmine_gtt", :media => "all")
        tags << stylesheet_link_tag("ol-ext.min.css", :plugin => "redmine_gtt", :media => "all")
        tags << stylesheet_link_tag("app.css", :plugin => "redmine_gtt", :media => "all")

        tags << javascript_include_tag('ol.js', :plugin => 'redmine_gtt')
        tags << javascript_include_tag('ol-ext.min.js', :plugin => 'redmine_gtt')
        tags << javascript_include_tag('app.js', :plugin => 'redmine_gtt')
        tags << javascript_include_tag('fontmaki-def.js', :plugin => 'redmine_gtt')
        return tags.join("\n")
      end

      def view_layouts_base_body_bottom(context={})
        tags = [];
        geocoder = {}
        begin
          geocoder = JSON.parse(Setting.plugin_redmine_gtt['default_geocoder_options'])
        rescue JSON::ParserError => exception
          Rails.logger.warn "Failed to parse setting's 'geocoder_options' as JSON: #{exception}\nUse default '{}' instead."
        end
        tags.push(tag.div :data => {
          :lon => Setting.plugin_redmine_gtt['default_map_center_longitude'],
          :lat => Setting.plugin_redmine_gtt['default_map_center_latitude'],
          :zoom => Setting.plugin_redmine_gtt['default_map_zoom_level'],
          :maxzoom => Setting.plugin_redmine_gtt['default_map_maxzoom_level'],
          :fit_maxzoom => Setting.plugin_redmine_gtt['default_map_fit_maxzoom_level'],
          :geocoder => geocoder,
          :plugin_settings => Setting.plugin_redmine_gtt.select{ |key, value| key.to_s.match(/^(?!default).+/) }
        }, :id => 'gtt-defaults', :style => 'display:none')
        return tags.join("\n")
      end

    end
  end
end
