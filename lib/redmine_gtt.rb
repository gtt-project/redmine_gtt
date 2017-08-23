# Global Hooks
require 'redmine_gtt/hooks/view_layouts_base_html_head_hook'

# Issue Hooks
require 'redmine_gtt/patches/issue_patch.rb'
require 'redmine_gtt/patches/issues_controller_patch.rb'
require 'redmine_gtt/patches/issues_helper_patch.rb'

# User Hooks
require 'redmine_gtt/patches/user_patch.rb'
require 'redmine_gtt/patches/users_controller_patch.rb'


# API Template Hooks
# Seems like this is not necessary
# require 'redmine_gtt/patches/api_template_handler_patch.rb'

# Configure View Overrides
Rails.application.paths["app/overrides"] ||= []
Dir.glob("#{Rails.root}/plugins/*/app/overrides").each do |dir|
  Rails.application.paths["app/overrides"] << dir unless Rails.application.paths["app/overrides"].include?(dir)
end

# Register MIME Types
Mime::Type.register_alias "application/json", :geojson


module RedmineGtt

  def self.setup
    RedmineGtt::Patches::ProjectPatch.apply

    RedmineGtt::Patches::ProjectsControllerPatch.apply
    RedmineGtt::Patches::ProjectsHelperPatch.apply

    # unless IssueQuery.included_modules.include?(RedmineGtt::Patches::IssueQueryPatch)
    # 	IssueQuery.send(:include, RedmineGtt::Patches::IssueQueryPatch)
    # end

    # IssuesController.send(:prepend, RedmineGtt::Patches::IssuesControllerPatch)

    #Redmine::Views::ApiTemplateHandler.send(:prepend, RedmineGtt::Patches::ApiTemplateHandlerPatch)
  end
end

