Rails.configuration.to_prepare do
  # Global Hooks
  require 'redmine_gtt/hooks/view_layouts_base_html_head_hook'

  # Issue Hooks
  #require 'redmine_gtt/hooks/view_issues_index_bottom_hook'
  #require 'redmine_gtt/hooks/view_issues_form_details_bottom_hook'
  #require 'redmine_gtt/hooks/view_issues_show_description_bottom_hook'
  #require 'redmine_gtt/hooks/controller_issues_edit_before_save_hook'

  # User Hooks
  #require 'redmine_gtt/hooks/view_users_form_hook.rb'
  #require 'redmine_gtt/hooks/view_my_account_hook.rb'
  #require 'redmine_gtt/hooks/view_account_hook.rb'

  # Project Hooks
  #require 'redmine_gtt/hooks/view_projects_form_hook.rb'
  #require 'redmine_gtt/hooks/view_projects_show_hook.rb'
end

# Apply Patches
ActionDispatch::Callbacks.to_prepare do

	require_dependency 'issue_query'

	# unless IssueQuery.included_modules.include?(RedmineGtt::Patches::IssueQueryPatch)
	# 	IssueQuery.send(:include, RedmineGtt::Patches::IssueQueryPatch)
	# end

	require_dependency 'issue'
	# Issue.send(:include, RedmineGtt::Patches::IssuePatch)

	require_dependency 'project'
	# Project.send(:include, RedmineGtt::Patches::ProjectPatch)

	require_dependency 'user'
	# User.send(:include, RedmineGtt::Patches::UserPatch)

  #Redmine::Views::ApiTemplateHandler.send(:prepend, RedmineGtt::Patches::ApiTemplateHandlerPatch)

  require_dependency 'issues_controller'
  # IssuesController.send(:prepend, RedmineGtt::Patches::IssuesControllerPatch)
end
