module RedmineGtt
  module Hooks
    class ViewLayoutsBaseHtmlHeadHook < Redmine::Hook::ViewListener

      include ActionView::Context

      def view_layouts_base_html_head(context={})
        tags = [];

        tags << javascript_include_tag('../main.js', :plugin => 'redmine_gtt')
        return tags.join("\n")
      end

      def view_layouts_base_body_bottom(context={})
        tags = [];

        geocoder = {
          enabled: false
        }

        if Setting.plugin_redmine_gtt['enable_geocoding_on_map'] == 'true'
          geocoder = {
            enabled: true,
            provider: Setting.plugin_redmine_gtt['default_geocoder_provider'],
            options: (JSON.parse(Setting.plugin_redmine_gtt['default_geocoder_options']) rescue {})
          }
        end

        tags.push(tag.div :data => {
          :lon => Setting.plugin_redmine_gtt['default_map_center_longitude'],
          :lat => Setting.plugin_redmine_gtt['default_map_center_latitude'],
          :zoom => Setting.plugin_redmine_gtt['default_map_zoom_level'],
          :maxzoom => Setting.plugin_redmine_gtt['default_map_maxzoom_level'],
          :vector_minzoom => Setting.plugin_redmine_gtt['vector_minzoom_level'],
          :fit_maxzoom => Setting.plugin_redmine_gtt['default_map_fit_maxzoom_level'],
          :geocoder => geocoder,
          :plugin_settings => Setting.plugin_redmine_gtt.select{ |key, value| key.to_s.match(/^(?!default).+/) },
          :i18n => l(:gtt_js).to_json.html_safe
        }, :id => 'gtt-defaults', :style => 'display:none')
        return tags.join("\n")
      end

    end
  end
end
