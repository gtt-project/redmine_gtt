module RedmineGtt
  module Hooks
    class ViewLayoutsBaseHtmlHeadHook < Redmine::Hook::ViewListener
      def view_layouts_base_html_head(context={})
        tags = [];
        tags << stylesheet_link_tag("ol.css", :plugin => "redmine_gtt", :media => "all")
        tags << javascript_include_tag('ol.js', :plugin => 'redmine_gtt')
        return tags.join(' ')
      end
      def view_layouts_base_body_bottom(context={})
      end
    end
  end
end
