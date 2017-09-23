# frozen_string_literal: true

# Global Hooks
require 'redmine_gtt/hooks/view_layouts_base_html_head_hook'
require 'redmine_gtt/view_hooks'


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
    RedmineGtt::Patches::IssuesHelperPatch.apply

    RedmineGtt::Patches::IssuePatch.apply
    RedmineGtt::Patches::ProjectPatch.apply
    RedmineGtt::Patches::UserPatch.apply

    RedmineGtt::Patches::IssuesControllerPatch.apply
    RedmineGtt::Patches::ProjectsControllerPatch.apply
    RedmineGtt::Patches::ProjectsHelperPatch.apply
    RedmineGtt::Patches::UsersControllerPatch.apply

    ProjectsController.class_eval do
      helper 'gtt_map'
    end
    UsersController.class_eval do
      helper 'gtt_map'
    end

    # unless IssueQuery.included_modules.include?(RedmineGtt::Patches::IssueQueryPatch)
    # 	IssueQuery.send(:include, RedmineGtt::Patches::IssueQueryPatch)
    # end


    #Redmine::Views::ApiTemplateHandler.send(:prepend, RedmineGtt::Patches::ApiTemplateHandlerPatch)
  end
end

