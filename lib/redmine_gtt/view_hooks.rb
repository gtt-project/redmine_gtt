module RedmineGtt
  class ViewHooks < Redmine::Hook::ViewListener

    include ActionView::Context

    # Render partials in various views
    render_on :view_account_left_bottom,
    partial: 'redmine_gtt/hooks/view_account_left_bottom'

    render_on :view_my_account,
      partial: 'redmine_gtt/hooks/view_my_account'

    render_on :view_users_form,
      partial: 'redmine_gtt/hooks/view_users_form'

    render_on :view_issues_form_details_top,
      partial: 'redmine_gtt/hooks/view_issues_form_details_top'

    render_on :view_layouts_base_body_bottom,
      partial: 'redmine_gtt/hooks/view_layouts_base_body_bottom'

    # Add meta tags to the HTML head to inform about available fonts with their URL including the digest
    def view_layouts_base_html_head(context={})
      tags = []
      tags << tag.meta(:name => 'gtt-font-custom-icons', :content => asset_path('plugin_assets/redmine_gtt/custom-icons.woff2'))
      tags << tag.meta(:name => 'gtt-font-mdi-webfont', :content => asset_path('plugin_assets/redmine_gtt/materialdesignicons-webfont.woff2'))
      return tags.join("\n")
    end

    # Add JavaScript and data tags to the body bottom
    def view_layouts_base_body_bottom(context={})
      tags = [];

      tags << javascript_include_tag('main', :plugin => 'redmine_gtt')

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
