# frozen_string_literal: true

module RedmineGtt
  class ViewHooks < Redmine::Hook::ViewListener
    render_on :view_account_left_bottom,
      partial: 'redmine_gtt/hooks/view_account_left_bottom'

    render_on :view_my_account,
      partial: 'redmine_gtt/hooks/view_my_account'

    render_on :view_users_form,
      partial: 'redmine_gtt/hooks/view_users_form'

    render_on :view_issues_form_details_top,
      partial: 'redmine_gtt/hooks/view_issues_form_details_top'
  end
end
