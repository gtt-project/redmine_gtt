# frozen_string_literal: true

module RedmineGtt

  def self.setup_normal_patches
    RedmineGtt::Patches::IssuesHelperPatch.apply

    RedmineGtt::Patches::IssuePatch.apply
    RedmineGtt::Patches::IssueQueryPatch.apply
    RedmineGtt::Patches::ProjectPatch.apply
    RedmineGtt::Patches::UserPatch.apply

    RedmineGtt::Patches::ProjectsHelperPatch.apply

    # unless IssueQuery.included_modules.include?(RedmineGtt::Patches::IssueQueryPatch)
    # 	IssueQuery.send(:include, RedmineGtt::Patches::IssueQueryPatch)
    # end


    #Redmine::Views::ApiTemplateHandler.send(:prepend, RedmineGtt::Patches::ApiTemplateHandlerPatch)
  end

  def self.setup_controller_patches

    RedmineGtt::Patches::IssuesControllerPatch.apply
    RedmineGtt::Patches::ProjectsControllerPatch.apply
    RedmineGtt::Patches::UsersControllerPatch.apply

    [
      IssuesController,
      MyController,
      ProjectsController,
      UsersController,
    ].each{ |c| c.send :helper, 'gtt_map' }
  end
end

