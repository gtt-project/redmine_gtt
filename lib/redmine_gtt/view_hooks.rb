module RedmineGtt
  class ViewHooks < Redmine::Hook::ViewListener
    render_on :view_account_left_bottom,
      partial: 'redmine_gtt/hooks/view_account_left_bottom'

    render_on :view_my_account,
      partial: 'redmine_gtt/hooks/view_my_account'
  end
end
