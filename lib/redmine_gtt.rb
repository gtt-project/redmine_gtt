# Global Hooks
require 'redmine_gtt/hooks/view/layouts/base_html_head_hook'

# Issue Hooks
require 'redmine_gtt/patches/issue_patch.rb'
require 'redmine_gtt/hooks/view/issues/index_bottom_hook'
require 'redmine_gtt/hooks/view/issues/form_details_bottom_hook'
require 'redmine_gtt/hooks/view/issues/show_description_bottom_hook'
require 'redmine_gtt/hooks/controller/issues/edit_before_save_hook'

# User Hooks
require 'redmine_gtt/patches/user_patch.rb'
require 'redmine_gtt/hooks/view/users/form_hook.rb'
require 'redmine_gtt/hooks/view/my/account/hook.rb'
require 'redmine_gtt/hooks/view/account/hook.rb'

# Project Hooks
require 'redmine_gtt/patches/project_patch.rb'
require 'redmine_gtt/hooks/view/projects/form_hook.rb'
require 'redmine_gtt/hooks/view/projects/show_hook.rb'

module RedmineGtt

end

# Apply Patches
# ActionDispatch::Callbacks.to_prepare do

# 	require_dependency 'issue_query'
# 	# unless IssueQuery.included_modules.include?(RedmineGtt::Patches::IssueQueryPatch)
# 	# 	IssueQuery.send(:include, RedmineGtt::Patches::IssueQueryPatch)
# 	# end

#   require_dependency 'issues_controller'
#   # IssuesController.send(:prepend, RedmineGtt::Patches::IssuesControllerPatch)

#   #Redmine::Views::ApiTemplateHandler.send(:prepend, RedmineGtt::Patches::ApiTemplateHandlerPatch)
# end
